import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { SupabaseService } from '../../database/supabase.service';
import type { CreateInvitationDto } from './dto/create-invitation.dto';

export interface ListingInvitation {
  id: string;
  property_id: string;
  agent_id: string;
  agent_name: string | null;
  agent_email: string;
  agent_agency: string | null;
  message: string | null;
  status: string;
  expires_at: string;
  created_at: string;
}

export interface InvitationPreview {
  id: string;
  message: string | null;
  status: string;
  expires_at: string;
  property: {
    id: string;
    headline: string | null;
    address: string;
    suburb: string;
    state: string;
    listing_type: string;
  };
  owner_name: string | null;
}

@Injectable()
export class ListingInvitationsService {
  private readonly resend: Resend;

  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService,
  ) {
    this.resend = new Resend(this.config.get<string>('resend.apiKey'));
  }

  async create(dto: CreateInvitationDto, ownerId: string): Promise<{ id: string }> {
    const { data: property } = await this.supabase.client
      .from('properties')
      .select('id, headline, unit_number, street_number, street_name, suburb, state, owner_id')
      .eq('id', dto.propertyId)
      .eq('owner_id', ownerId)
      .single();

    if (!property) throw new NotFoundException('Property not found or access denied');

    const prop = property as {
      id: string;
      headline: string | null;
      unit_number: string | null;
      street_number: string;
      street_name: string;
      suburb: string;
      state: string;
    };

    const { data: existing } = await this.supabase.client
      .from('listing_invitations')
      .select('id')
      .eq('property_id', dto.propertyId)
      .eq('status', 'pending')
      .maybeSingle();

    if (existing) throw new ConflictException('A pending invitation already exists for this listing');

    const { data: agent } = await this.supabase.client
      .from('agents')
      .select('id, profile_id')
      .eq('id', dto.agentId)
      .single();

    if (!agent) throw new NotFoundException('Agent not found');

    const agentRow = agent as { id: string; profile_id: string };

    const [{ data: agentProfile }, { data: ownerProfile }] = await Promise.all([
      this.supabase.client
        .from('profiles')
        .select('full_name, email')
        .eq('id', agentRow.profile_id)
        .single(),
      this.supabase.client.from('profiles').select('full_name').eq('id', ownerId).single(),
    ]);

    const { data: invitation, error } = await this.supabase.client
      .from('listing_invitations')
      .insert({
        property_id: dto.propertyId,
        owner_id: ownerId,
        agent_id: dto.agentId,
        message: dto.message ?? null,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select('id, token')
      .single();

    if (error) throw error;

    const inv = invitation as { id: string; token: string };
    const address = [
      prop.unit_number
        ? `${prop.unit_number}/${prop.street_number}`
        : prop.street_number,
      prop.street_name,
      prop.suburb,
      prop.state.toUpperCase(),
    ]
      .filter(Boolean)
      .join(' ');

    const agentEmail = (agentProfile as { full_name: string | null; email: string } | null)?.email;
    if (agentEmail) {
      this.sendInvitationEmail({
        agentEmail,
        agentName:
          (agentProfile as { full_name: string | null }).full_name ?? 'Agent',
        ownerName:
          (ownerProfile as { full_name: string | null } | null)?.full_name ?? 'Property owner',
        address: prop.headline ?? address,
        message: dto.message ?? null,
        token: inv.token,
      }).catch((err: unknown) => {
        console.error('[ListingInvitationsService] Failed to send invitation email:', err);
      });
    }

    return { id: inv.id };
  }

  async preview(token: string): Promise<InvitationPreview> {
    const { data: invitation } = await this.supabase.client
      .from('listing_invitations')
      .select('id, status, expires_at, message, property_id, owner_id')
      .eq('token', token)
      .single();

    if (!invitation) throw new NotFoundException('Invitation not found');

    const inv = invitation as {
      id: string;
      status: string;
      expires_at: string;
      message: string | null;
      property_id: string;
      owner_id: string;
    };

    if (inv.status === 'pending' && new Date(inv.expires_at) < new Date()) {
      await this.supabase.client
        .from('listing_invitations')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('id', inv.id);
      throw new BadRequestException('invitation_expired');
    }

    const [{ data: property }, { data: ownerProfile }] = await Promise.all([
      this.supabase.client
        .from('properties')
        .select('id, headline, unit_number, street_number, street_name, suburb, state, listing_type')
        .eq('id', inv.property_id)
        .single(),
      this.supabase.client.from('profiles').select('full_name').eq('id', inv.owner_id).single(),
    ]);

    const prop = property as {
      id: string;
      headline: string | null;
      unit_number: string | null;
      street_number: string;
      street_name: string;
      suburb: string;
      state: string;
      listing_type: string;
    };

    const address = [
      prop.unit_number
        ? `${prop.unit_number}/${prop.street_number}`
        : prop.street_number,
      prop.street_name,
      prop.suburb,
      prop.state.toUpperCase(),
    ]
      .filter(Boolean)
      .join(' ');

    return {
      id: inv.id,
      message: inv.message,
      status: inv.status,
      expires_at: inv.expires_at,
      property: {
        id: prop.id,
        headline: prop.headline,
        address,
        suburb: prop.suburb,
        state: prop.state,
        listing_type: prop.listing_type,
      },
      owner_name: (ownerProfile as { full_name: string | null } | null)?.full_name ?? null,
    };
  }

  async accept(token: string): Promise<void> {
    const { data: invitation } = await this.supabase.client
      .from('listing_invitations')
      .select('id, status, expires_at, property_id, owner_id, agent_id')
      .eq('token', token)
      .single();

    if (!invitation) throw new NotFoundException('Invitation not found');

    const inv = invitation as {
      id: string;
      status: string;
      expires_at: string;
      property_id: string;
      owner_id: string;
      agent_id: string;
    };

    if (inv.status !== 'pending') throw new BadRequestException('Invitation is no longer valid');
    if (new Date(inv.expires_at) < new Date()) throw new BadRequestException('invitation_expired');

    const { data: agent } = await this.supabase.client
      .from('agents')
      .select('id, agency_id, profile_id')
      .eq('id', inv.agent_id)
      .single();

    if (!agent) throw new NotFoundException('Agent not found');
    const agentRow = agent as { id: string; agency_id: string; profile_id: string };

    const { error: propError } = await this.supabase.client
      .from('properties')
      .update({
        agent_id: inv.agent_id,
        agency_id: agentRow.agency_id,
        listing_source: 'transferred',
        updated_at: new Date().toISOString(),
      })
      .eq('id', inv.property_id);

    if (propError) throw propError;

    const { error: invError } = await this.supabase.client
      .from('listing_invitations')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', inv.id);

    if (invError) throw invError;

    const [{ data: ownerProfile }, { data: agentProfile }, { data: property }] = await Promise.all([
      this.supabase.client
        .from('profiles')
        .select('full_name, email')
        .eq('id', inv.owner_id)
        .single(),
      this.supabase.client
        .from('profiles')
        .select('full_name, email, phone')
        .eq('id', agentRow.profile_id)
        .single(),
      this.supabase.client
        .from('properties')
        .select('headline, suburb, state')
        .eq('id', inv.property_id)
        .single(),
    ]);

    const ownerEmail = (ownerProfile as { full_name: string | null; email: string } | null)
      ?.email;

    if (ownerEmail) {
      const prop = property as { headline: string | null; suburb: string; state: string } | null;
      this.sendAcceptanceEmail({
        ownerEmail,
        ownerName:
          (ownerProfile as { full_name: string | null }).full_name ?? 'Property owner',
        agentName:
          (agentProfile as { full_name: string | null } | null)?.full_name ?? 'Agent',
        agentEmail:
          (agentProfile as { email: string } | null)?.email ?? '',
        agentPhone:
          (agentProfile as { phone: string | null } | null)?.phone ?? null,
        address: prop?.headline ?? `${prop?.suburb ?? ''}, ${prop?.state?.toUpperCase() ?? ''}`,
      }).catch((err: unknown) => {
        console.error('[ListingInvitationsService] Failed to send acceptance email:', err);
      });
    }
  }

  async decline(token: string): Promise<void> {
    const { data: invitation } = await this.supabase.client
      .from('listing_invitations')
      .select('id, status')
      .eq('token', token)
      .single();

    if (!invitation) throw new NotFoundException('Invitation not found');

    const inv = invitation as { id: string; status: string };
    if (inv.status !== 'pending') throw new BadRequestException('Invitation is no longer valid');

    const { error } = await this.supabase.client
      .from('listing_invitations')
      .update({ status: 'declined', updated_at: new Date().toISOString() })
      .eq('id', inv.id);

    if (error) throw error;
  }

  async cancel(id: string, ownerId: string): Promise<void> {
    const { data: invitation } = await this.supabase.client
      .from('listing_invitations')
      .select('id, owner_id, status')
      .eq('id', id)
      .single();

    if (!invitation) throw new NotFoundException('Invitation not found');

    const inv = invitation as { id: string; owner_id: string; status: string };
    if (inv.owner_id !== ownerId) throw new ForbiddenException();
    if (inv.status !== 'pending')
      throw new BadRequestException('Only pending invitations can be cancelled');

    const { error } = await this.supabase.client
      .from('listing_invitations')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', inv.id);

    if (error) throw error;
  }

  async findPendingByProperty(
    propertyId: string,
    ownerId: string,
  ): Promise<ListingInvitation | null> {
    const { data } = await this.supabase.client
      .from('listing_invitations')
      .select('id, property_id, agent_id, message, status, expires_at, created_at')
      .eq('property_id', propertyId)
      .eq('owner_id', ownerId)
      .eq('status', 'pending')
      .maybeSingle();

    if (!data) return null;

    const row = data as {
      id: string;
      property_id: string;
      agent_id: string;
      message: string | null;
      status: string;
      expires_at: string;
      created_at: string;
    };

    const { data: agent } = await this.supabase.client
      .from('agents')
      .select('id, profile_id, agency_id')
      .eq('id', row.agent_id)
      .single();

    if (!agent) return null;

    const agentRow = agent as { id: string; profile_id: string; agency_id: string };

    const [{ data: profile }, { data: agency }] = await Promise.all([
      this.supabase.client
        .from('profiles')
        .select('full_name, email')
        .eq('id', agentRow.profile_id)
        .single(),
      this.supabase.client
        .from('agencies')
        .select('name')
        .eq('id', agentRow.agency_id)
        .single(),
    ]);

    return {
      id: row.id,
      property_id: row.property_id,
      agent_id: row.agent_id,
      agent_name: (profile as { full_name: string | null } | null)?.full_name ?? null,
      agent_email: (profile as { full_name: string | null; email: string } | null)?.email ?? '',
      agent_agency: (agency as { name: string } | null)?.name ?? null,
      message: row.message,
      status: row.status,
      expires_at: row.expires_at,
      created_at: row.created_at,
    };
  }

  private get fromEmail(): string {
    return (
      this.config.get<string>('resend.fromEmail') ?? 'PropSphere <noreply@propsphere.app>'
    );
  }

  private async sendInvitationEmail(params: {
    agentEmail: string;
    agentName: string;
    ownerName: string;
    address: string;
    message: string | null;
    token: string;
  }): Promise<void> {
    const { agentEmail, agentName, ownerName, address, message, token } = params;
    const acceptUrl = `${this.config.get<string>('app.url') ?? 'https://propsphere.app'}/accept-invitation/${token}`;

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
            <p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#111827">You've been invited</p>
            <p style="margin:0 0 24px;font-size:14px;color:#6b7280">Hi ${agentName}, ${ownerName} has invited you to manage a listing.</p>
            <table cellpadding="0" cellspacing="0" style="width:100%;background:#f9fafb;border-radius:8px;padding:4px 16px;margin:0 0 20px">
              <tr>
                <td style="padding:6px 12px 6px 0;color:#6b7280;font-size:14px;white-space:nowrap">Property</td>
                <td style="padding:6px 0;font-size:14px;font-weight:500">${address}</td>
              </tr>
              <tr>
                <td style="padding:6px 12px 6px 0;color:#6b7280;font-size:14px;white-space:nowrap">From</td>
                <td style="padding:6px 0;font-size:14px">${ownerName}</td>
              </tr>
            </table>
            ${message ? `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;margin:0 0 20px"><p style="margin:0 0 4px;font-size:13px;font-weight:500;color:#92400e">Message from owner</p><p style="margin:0;font-size:14px;color:#78350f">${message}</p></div>` : ''}
            <p style="margin:0 0 20px;font-size:14px;color:#374151">If you accept, you will become the managing agent for this listing. This invitation expires in 7 days.</p>
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-right:12px">
                  <a href="${acceptUrl}" style="display:inline-block;background:#1d4ed8;color:#ffffff;font-size:14px;font-weight:600;padding:10px 20px;border-radius:8px;text-decoration:none">Accept Invitation</a>
                </td>
                <td>
                  <a href="${acceptUrl}" style="display:inline-block;color:#6b7280;font-size:14px;padding:10px 0;text-decoration:none">Decline</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 28px;border-top:1px solid #f3f4f6;font-size:12px;color:#9ca3af">
            This invitation was sent via PropSphere on behalf of ${ownerName}.
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    await this.resend.emails.send({
      from: this.fromEmail,
      to: agentEmail,
      subject: `${ownerName} has invited you to manage a listing — ${address}`,
      text: `Hi ${agentName}, ${ownerName} has invited you to become the managing agent for ${address}. Visit ${acceptUrl} to accept or decline.`,
      html,
    });
  }

  private async sendAcceptanceEmail(params: {
    ownerEmail: string;
    ownerName: string;
    agentName: string;
    agentEmail: string;
    agentPhone: string | null;
    address: string;
  }): Promise<void> {
    const { ownerEmail, ownerName, agentName, agentEmail, agentPhone, address } = params;

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
            <p style="margin:0 0 4px;font-size:22px;font-weight:700;color:#111827">Invitation accepted</p>
            <p style="margin:0 0 24px;font-size:14px;color:#6b7280">Hi ${ownerName}, ${agentName} has accepted your invitation and is now the managing agent for:</p>
            <p style="margin:0 0 20px;font-size:16px;font-weight:600;color:#111827">${address}</p>
            <table cellpadding="0" cellspacing="0" style="width:100%;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:4px 16px;margin:0 0 20px">
              <tr>
                <td style="padding:6px 12px 6px 0;color:#166534;font-size:14px;white-space:nowrap">Agent</td>
                <td style="padding:6px 0;font-size:14px;font-weight:500;color:#166534">${agentName}</td>
              </tr>
              <tr>
                <td style="padding:6px 12px 6px 0;color:#166534;font-size:14px;white-space:nowrap">Email</td>
                <td style="padding:6px 0;font-size:14px"><a href="mailto:${agentEmail}" style="color:#1d4ed8;text-decoration:none">${agentEmail}</a></td>
              </tr>
              ${agentPhone ? `<tr><td style="padding:6px 12px 6px 0;color:#166534;font-size:14px;white-space:nowrap">Phone</td><td style="padding:6px 0;font-size:14px">${agentPhone}</td></tr>` : ''}
            </table>
            <p style="margin:0;font-size:13px;color:#6b7280">The agent can now manage your listing from their PropSphere dashboard.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 28px;border-top:1px solid #f3f4f6;font-size:12px;color:#9ca3af">
            Sent via PropSphere.
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    await this.resend.emails.send({
      from: this.fromEmail,
      to: ownerEmail,
      subject: `${agentName} accepted your invitation — ${address}`,
      text: `Hi ${ownerName}, ${agentName} has accepted your invitation and is now the managing agent for ${address}. Contact: ${agentEmail}${agentPhone ? ` / ${agentPhone}` : ''}.`,
      html,
    });
  }
}
