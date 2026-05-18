import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { SupabaseService } from '../../database/supabase.service';
import type { CreateOfferDto } from './dto/create-offer.dto';

@Injectable()
export class OffersService {
  private readonly resend: Resend;

  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService,
  ) {
    this.resend = new Resend(this.config.get<string>('resend.apiKey'));
  }

  async create(dto: CreateOfferDto, authHeader?: string): Promise<{ id: string }> {
    let senderId: string | null = null;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const {
        data: { user },
      } = await this.supabase.client.auth.getUser(token);
      senderId = user?.id ?? null;
    }

    const { data: property } = await this.supabase.client
      .from('properties')
      .select('unit_number, street_number, street_name, suburb, state')
      .eq('id', dto.propertyId)
      .single();

    if (!property) throw new NotFoundException('Property not found');

    const p = property as {
      unit_number: string | null;
      street_number: string;
      street_name: string;
      suburb: string;
      state: string;
    };

    const address = [
      p.unit_number ? `${p.unit_number}/${p.street_number}` : p.street_number,
      p.street_name,
      p.suburb,
      p.state,
    ]
      .filter(Boolean)
      .join(' ');

    const { data: offer, error } = await this.supabase.client
      .from('offers')
      .insert({
        property_id:     dto.propertyId,
        agent_id:        dto.agentId,
        sender_id:       senderId,
        sender_name:     dto.senderName,
        sender_email:    dto.senderEmail,
        sender_phone:    dto.senderPhone ?? null,
        amount:          dto.amount,
        message:         dto.message ?? null,
        is_confidential: dto.isConfidential ?? false,
        status:          'pending',
      })
      .select('id')
      .single();

    if (error) throw error;

    const agentEmail = await this.fetchAgentEmail(dto.agentId);
    if (agentEmail) {
      this.sendOfferEmail({
        agentEmail,
        senderName:  dto.senderName,
        senderEmail: dto.senderEmail,
        amount:      dto.amount,
        address,
      }).catch((err: unknown) => {
        console.error('[OffersService] Failed to send offer email:', err);
      });
    }

    return { id: (offer as { id: string }).id };
  }

  async updateStatus(
    id: string,
    status: string,
    userId: string,
  ): Promise<{ id: string; status: string }> {
    const { data: offer, error: findError } = await this.supabase.client
      .from('offers')
      .select('id, agent_id')
      .eq('id', id)
      .single();

    if (findError || !offer) throw new NotFoundException(`Offer ${id} not found`);

    const { data: agentRow } = await this.supabase.client
      .from('agents')
      .select('id')
      .eq('profile_id', userId)
      .single();

    const offerRow = offer as { id: string; agent_id: string };
    const agent = agentRow as { id: string } | null;

    if (!agent || offerRow.agent_id !== agent.id) {
      throw new ForbiddenException();
    }

    const { data, error } = await this.supabase.client
      .from('offers')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, status')
      .single();

    if (error) throw error;
    return data as { id: string; status: string };
  }

  private async fetchAgentEmail(agentId: string): Promise<string | null> {
    const { data: agent } = await this.supabase.client
      .from('agents')
      .select('profile_id')
      .eq('id', agentId)
      .single();

    if (!agent) return null;

    const { data: profile } = await this.supabase.client
      .from('profiles')
      .select('email')
      .eq('id', (agent as { profile_id: string }).profile_id)
      .single();

    return (profile as { email: string } | null)?.email ?? null;
  }

  private async sendOfferEmail(params: {
    agentEmail: string;
    senderName: string;
    senderEmail: string;
    amount: number;
    address: string;
  }) {
    const { agentEmail, senderName, senderEmail, amount, address } = params;
    const fromEmail =
      this.config.get<string>('resend.fromEmail') ?? 'PropSphere <noreply@propsphere.app>';

    const formattedAmount = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden">
        <tr>
          <td style="background:#1d4ed8;padding:20px 28px">
            <p style="margin:0;color:#ffffff;font-size:18px;font-weight:600">PropSphere</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px">
            <p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#111827">New Offer Received</p>
            <p style="margin:0 0 24px;font-size:14px;color:#6b7280">${address}</p>
            <table cellpadding="0" cellspacing="0" style="width:100%;background:#f9fafb;border-radius:8px;padding:4px 16px;margin:0 0 20px">
              <tr>
                <td style="padding:6px 12px 6px 0;color:#6b7280;font-size:14px;white-space:nowrap">Buyer</td>
                <td style="padding:6px 0;font-size:14px;font-weight:500">${senderName}</td>
              </tr>
              <tr>
                <td style="padding:6px 12px 6px 0;color:#6b7280;font-size:14px;white-space:nowrap">Email</td>
                <td style="padding:6px 0;font-size:14px"><a href="mailto:${senderEmail}" style="color:#1d4ed8;text-decoration:none">${senderEmail}</a></td>
              </tr>
              <tr>
                <td style="padding:6px 12px 6px 0;color:#6b7280;font-size:14px;white-space:nowrap">Offer</td>
                <td style="padding:6px 0;font-size:18px;font-weight:700;color:#111827">${formattedAmount}</td>
              </tr>
            </table>
            <p style="margin:0;font-size:13px;color:#6b7280">Log in to your PropSphere dashboard to accept or reject this offer.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 28px;border-top:1px solid #f3f4f6;font-size:12px;color:#9ca3af">
            This email was sent via PropSphere. Reply to contact ${senderName} directly.
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    await this.resend.emails.send({
      from:    fromEmail,
      to:      agentEmail,
      replyTo: senderEmail,
      subject: `New offer from ${senderName} — ${address}`,
      text:    `New offer of ${formattedAmount} from ${senderName} <${senderEmail}> for ${address}. Log in to your dashboard to respond.`,
      html,
    });
  }
}
