import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { SupabaseService } from '../../database/supabase.service';
import type { CreateEnquiryDto } from './dto/create-enquiry.dto';

@Injectable()
export class EnquiriesService {
  private readonly resend: Resend;

  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService,
  ) {
    this.resend = new Resend(this.config.get<string>('resend.apiKey'));
  }

  async create(dto: CreateEnquiryDto, authHeader?: string) {
    // Resolve sender_id from JWT if the user is authenticated
    let senderId: string | null = null;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const { data: { user } } = await this.supabase.client.auth.getUser(token);
      senderId = user?.id ?? null;
    }

    // Fetch property for address (optional — agent-level enquiries have no property)
    let address = 'General enquiry';
    if (dto.property_id) {
      const { data: property } = await this.supabase.client
        .from('properties')
        .select('unit_number, street_number, street_name, suburb, state')
        .eq('id', dto.property_id)
        .single();

      if (!property) throw new NotFoundException('Property not found');

      const p = property as {
        unit_number: string | null;
        street_number: string;
        street_name: string;
        suburb: string;
        state: string;
      };

      address = [
        p.unit_number ? `${p.unit_number}/${p.street_number}` : p.street_number,
        p.street_name,
        p.suburb,
        p.state,
      ]
        .filter(Boolean)
        .join(' ');
    }

    // Fetch agent profile email
    const { agentEmail, agentName } = await this.fetchAgentContact(dto.agent_id);

    // Insert enquiry row
    const { data: enquiry, error } = await this.supabase.client
      .from('enquiries')
      .insert({
        property_id: dto.property_id,
        agent_id: dto.agent_id,
        sender_id: senderId,
        sender_name: dto.sender_name,
        sender_email: dto.sender_email,
        sender_phone: dto.sender_phone ?? null,
        message: dto.message,
        status: 'new',
      })
      .select('id')
      .single();

    if (error) throw error;

    // Increment enquiry_count — fire and forget (only when linked to a property)
    if (dto.property_id) {
      void Promise.resolve(
        this.supabase.client.rpc('increment_enquiry_count', { prop_id: dto.property_id }),
      );
    }

    // Send email — non-blocking
    const testRecipient = this.config.get<string>('resend.testRecipient');
    const toEmail = testRecipient || agentEmail;
    if (toEmail) {
      this.sendEnquiryEmail({
        agentEmail: toEmail,
        agentName,
        senderName: dto.sender_name,
        senderEmail: dto.sender_email,
        senderPhone: dto.sender_phone,
        message: dto.message,
        address,
      }).catch((err: unknown) => {
        console.error('[EnquiriesService] Failed to send enquiry email:', JSON.stringify(err));
      });
    }

    return { id: (enquiry as { id: string }).id };
  }

  private async fetchAgentContact(agentId: string) {
    const { data: agent } = await this.supabase.client
      .from('agents')
      .select('profile_id')
      .eq('id', agentId)
      .single();

    if (!agent) return { agentEmail: '', agentName: '' };

    const { data: profile } = await this.supabase.client
      .from('profiles')
      .select('email, full_name')
      .eq('id', (agent as { profile_id: string }).profile_id)
      .single();

    return {
      agentEmail: (profile as { email: string } | null)?.email ?? '',
      agentName: (profile as { full_name: string | null } | null)?.full_name ?? '',
    };
  }

  private async sendEnquiryEmail(params: {
    agentEmail: string;
    agentName: string;
    senderName: string;
    senderEmail: string;
    senderPhone?: string;
    message: string;
    address: string;
  }) {
    const { agentEmail, agentName, senderName, senderEmail, senderPhone, message, address } = params;
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
              Hi ${agentName || 'there'},<br /><br />
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
      `Hi ${agentName || 'there'},`,
      '',
      `You have a new enquiry for ${address}.`,
      '',
      `From: ${senderName} <${senderEmail}>`,
      senderPhone ? `Phone: ${senderPhone}` : null,
      '',
      message,
    ].filter((l): l is string => l !== null);

    await this.resend.emails.send({
      from: fromEmail,
      to: agentEmail,
      replyTo: senderEmail,
      subject: `New enquiry from ${senderName} — ${address}`,
      text: textLines.join('\n'),
      html,
    });
  }
}
