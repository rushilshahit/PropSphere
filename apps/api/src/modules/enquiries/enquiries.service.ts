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

  async create(dto: CreateEnquiryDto) {
    // Fetch property for address and existence check
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

    const address = [
      p.unit_number ? `${p.unit_number}/${p.street_number}` : p.street_number,
      p.street_name,
      p.suburb,
      p.state,
    ]
      .filter(Boolean)
      .join(' ');

    // Fetch agent profile email
    const { agentEmail, agentName } = await this.fetchAgentContact(dto.agent_id);

    // Insert enquiry row
    const { data: enquiry, error } = await this.supabase.client
      .from('enquiries')
      .insert({
        property_id: dto.property_id,
        agent_id: dto.agent_id,
        sender_name: dto.sender_name,
        sender_email: dto.sender_email,
        sender_phone: dto.sender_phone ?? null,
        message: dto.message,
        status: 'new',
      })
      .select('id')
      .single();

    if (error) throw error;

    // Increment enquiry_count — fire and forget
    void Promise.resolve(
      this.supabase.client.rpc('increment_enquiry_count', { prop_id: dto.property_id }),
    );

    // Send email — non-blocking
    if (agentEmail) {
      this.sendEnquiryEmail({
        agentEmail,
        agentName,
        senderName: dto.sender_name,
        senderEmail: dto.sender_email,
        senderPhone: dto.sender_phone,
        message: dto.message,
        address,
      }).catch(() => {});
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

    const lines = [
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
      from: 'PropSphere <noreply@propsphere.app>',
      to: agentEmail,
      replyTo: senderEmail,
      subject: `New enquiry from ${senderName} — ${address}`,
      text: lines.join('\n'),
    });
  }
}
