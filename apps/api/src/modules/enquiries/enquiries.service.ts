import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { SupabaseService } from '../../database/supabase.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { CreateEnquiryDto } from './dto/create-enquiry.dto';

interface PropertyRow {
  unit_number: string | null;
  street_number: string;
  street_name: string;
  suburb: string;
  state: string;
  listing_source: string;
  owner_id: string | null;
}

interface Contact {
  email: string;
  name: string;
  recipientId: string | null;
  /** Profile user ID to route in-app notifications — owner_id for owner listings, agent profile_id for agent listings */
  notificationUserId: string | null;
  isOwner: boolean;
}

@Injectable()
export class EnquiriesService {
  private readonly resend: Resend;

  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService,
    private readonly notifications: NotificationsService,
  ) {
    this.resend = new Resend(this.config.get<string>('resend.apiKey'));
  }

  async create(dto: CreateEnquiryDto, authHeader?: string) {
    let senderId: string | null = null;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const { data: { user } } = await this.supabase.client.auth.getUser(token);
      senderId = user?.id ?? null;
    }

    let address = 'General enquiry';
    let suburb: string | undefined;
    let contact: Contact = { email: '', name: '', recipientId: null, notificationUserId: null, isOwner: false };

    if (dto.property_id) {
      const { data: property } = await this.supabase.client
        .from('properties')
        .select('unit_number, street_number, street_name, suburb, state, listing_source, owner_id')
        .eq('id', dto.property_id)
        .single();

      if (!property) throw new NotFoundException('Property not found');

      const p = property as PropertyRow;
      suburb = p.suburb;
      address = [
        p.unit_number ? `${p.unit_number}/${p.street_number}` : p.street_number,
        p.street_name,
        p.suburb,
        p.state,
      ]
        .filter(Boolean)
        .join(' ');

      if (p.listing_source === 'owner' && p.owner_id) {
        contact = await this.fetchOwnerContact(p.owner_id);
      } else if (dto.agent_id) {
        contact = await this.fetchAgentContact(dto.agent_id);
      }
    } else if (dto.agent_id) {
      contact = await this.fetchAgentContact(dto.agent_id);
    }

    const enquiryInsert: Record<string, unknown> = {
      property_id: dto.property_id ?? null,
      sender_id: senderId,
      sender_name: dto.sender_name,
      sender_email: dto.sender_email,
      sender_phone: dto.sender_phone ?? null,
      message: dto.message,
      status: 'new',
    };

    if (contact.isOwner) {
      enquiryInsert['owner_id'] = contact.recipientId;
      enquiryInsert['agent_id'] = null;
    } else {
      enquiryInsert['agent_id'] = dto.agent_id ?? null;
      enquiryInsert['owner_id'] = null;
    }

    const { data: enquiry, error } = await this.supabase.client
      .from('enquiries')
      .insert(enquiryInsert)
      .select('id')
      .single();

    if (error) throw error;

    if (dto.property_id) {
      void Promise.resolve(
        this.supabase.client.rpc('increment_enquiry_count', { prop_id: dto.property_id }),
      );
    }

    if (contact.notificationUserId) {
      void this.notifications.dispatch(contact.notificationUserId, {
        type: 'system',
        title: 'New enquiry received',
        body: `${dto.sender_name} sent an enquiry about ${address}`,
        data: { enquiryId: (enquiry as { id: string }).id, ...(dto.property_id ? { propertyId: dto.property_id } : {}) },
      });
    }

    const testRecipient = this.config.get<string>('resend.testRecipient');
    const toEmail = testRecipient || contact.email;
    if (toEmail) {
      this.sendEnquiryEmail({
        recipientEmail: toEmail,
        recipientName: contact.name,
        senderName: dto.sender_name,
        senderEmail: dto.sender_email,
        senderPhone: dto.sender_phone,
        message: dto.message,
        address,
        isOwner: contact.isOwner,
        suburb,
      }).catch((err: unknown) => {
        console.error('[EnquiriesService] Failed to send enquiry email:', JSON.stringify(err));
      });
    }

    return { id: (enquiry as { id: string }).id };
  }

  private async fetchOwnerContact(ownerId: string): Promise<Contact> {
    const { data: profile } = await this.supabase.client
      .from('profiles')
      .select('email, full_name')
      .eq('id', ownerId)
      .single();

    return {
      email: (profile as { email: string } | null)?.email ?? '',
      name: (profile as { full_name: string | null } | null)?.full_name ?? '',
      recipientId: ownerId,
      notificationUserId: ownerId,
      isOwner: true,
    };
  }

  private async fetchAgentContact(agentId: string): Promise<Contact> {
    const { data: agent } = await this.supabase.client
      .from('agents')
      .select('profile_id')
      .eq('id', agentId)
      .single();

    if (!agent) return { email: '', name: '', recipientId: agentId, notificationUserId: null, isOwner: false };

    const profileId = (agent as { profile_id: string }).profile_id;
    const { data: profile } = await this.supabase.client
      .from('profiles')
      .select('email, full_name')
      .eq('id', profileId)
      .single();

    return {
      email: (profile as { email: string } | null)?.email ?? '',
      name: (profile as { full_name: string | null } | null)?.full_name ?? '',
      recipientId: agentId,
      notificationUserId: profileId,
      isOwner: false,
    };
  }

  private async sendEnquiryEmail(params: {
    recipientEmail: string;
    recipientName: string;
    senderName: string;
    senderEmail: string;
    senderPhone?: string;
    message: string;
    address: string;
    isOwner?: boolean;
    suburb?: string;
  }) {
    const { recipientEmail, recipientName, senderName, senderEmail, senderPhone, message, address, isOwner, suburb } = params;
    const fromEmail = this.config.get<string>('resend.fromEmail') ?? 'PropSphere <noreply@propsphere.app>';

    const phoneRow = senderPhone
      ? `<tr>
           <td style="padding:6px 12px 6px 0;color:#6b7280;font-size:14px;white-space:nowrap">Phone</td>
           <td style="padding:6px 0;font-size:14px">${senderPhone}</td>
         </tr>`
      : '';

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden">
        <!-- Header -->
        <tr>
          <td style="background:#1d4ed8;padding:20px 28px">
            <p style="margin:0;color:#ffffff;font-size:18px;font-weight:600">PropSphere</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:28px">
            <p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#111827">New Enquiry</p>
            <p style="margin:0 0 24px;font-size:14px;color:#6b7280">${address}</p>

            <p style="margin:0 0 16px;font-size:15px;color:#374151">
              Hi ${recipientName || 'there'},<br /><br />
              You have received a new enquiry for <strong>${address}</strong>.
              You can reply directly to this email to respond to ${senderName}.
            </p>

            <!-- Sender details -->
            <table cellpadding="0" cellspacing="0" style="width:100%;background:#f9fafb;border-radius:8px;padding:4px 16px;margin:0 0 20px">
              <tr>
                <td style="padding:6px 12px 6px 0;color:#6b7280;font-size:14px;white-space:nowrap">Name</td>
                <td style="padding:6px 0;font-size:14px;font-weight:500">${senderName}</td>
              </tr>
              <tr>
                <td style="padding:6px 12px 6px 0;color:#6b7280;font-size:14px;white-space:nowrap">Email</td>
                <td style="padding:6px 0;font-size:14px"><a href="mailto:${senderEmail}" style="color:#1d4ed8;text-decoration:none">${senderEmail}</a></td>
              </tr>
              ${phoneRow}
            </table>

            <!-- Message -->
            <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em">Message</p>
            <div style="background:#f9fafb;border-left:3px solid #1d4ed8;border-radius:0 8px 8px 0;padding:16px;font-size:14px;color:#374151;white-space:pre-wrap;line-height:1.6">${message}</div>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:16px 28px;border-top:1px solid #f3f4f6;font-size:12px;color:#9ca3af">
            This email was sent via PropSphere. Reply to this email to contact ${senderName} directly.
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const textLines = [
      `Hi ${recipientName || 'there'},`,
      '',
      `You have a new enquiry for ${address}.`,
      '',
      `From: ${senderName} <${senderEmail}>`,
      senderPhone ? `Phone: ${senderPhone}` : null,
      '',
      message,
    ].filter((l): l is string => l !== null);

    const subject = isOwner && suburb
      ? `New enquiry on your ${suburb} property`
      : `New enquiry from ${senderName} — ${address}`;

    await this.resend.emails.send({
      from: fromEmail,
      to: recipientEmail,
      replyTo: senderEmail,
      subject,
      text: textLines.join('\n'),
      html,
    });
  }
}
