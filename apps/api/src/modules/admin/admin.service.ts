import { Injectable, NotFoundException } from '@nestjs/common';

import { SupabaseService } from '../../database/supabase.service';

const PAGE_SIZE = 24;

interface AdminProfile {
  id: string;
  full_name: string | null;
  email: string;
}

@Injectable()
export class AdminService {
  constructor(private readonly supabase: SupabaseService) {}

  // ── Audit ──────────────────────────────────────────────────────────────
  private async audit(actor: AdminProfile, action: string, target?: Record<string, unknown>) {
    await this.supabase.client.from('audit_logs').insert({
      admin_id: actor.id,
      admin_email: actor.email,
      action,
      target: target ?? null,
      created_at: new Date().toISOString(),
    });
  }

  // ── Dashboard ──────────────────────────────────────────────────────────
  async getDashboardStats() {
    const today = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [
      { count: activeListings },
      { count: newListingsToday },
      { count: enquiriesThisWeek },
      { count: newUsersToday },
      { count: unreadEnquiries },
      { count: featuredListings },
      { data: listingsByStatus },
      { data: topSuburbs },
      { data: enquiriesByDay },
      { data: registrationsByDay },
    ] = await Promise.all([
      this.supabase.client.from('properties').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      this.supabase.client.from('properties').select('*', { count: 'exact', head: true }).gte('published_at', today),
      this.supabase.client.from('enquiries').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
      this.supabase.client.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', today),
      this.supabase.client.from('enquiries').select('*', { count: 'exact', head: true }).eq('status', 'new'),
      this.supabase.client.from('properties').select('*', { count: 'exact', head: true }).eq('is_featured', true),
      this.supabase.client.rpc('admin_listings_by_status'),
      this.supabase.client.rpc('admin_top_suburbs', { limit_count: 5 }),
      this.supabase.client.rpc('admin_enquiries_by_day', { since: thirtyDaysAgo }),
      this.supabase.client.rpc('admin_registrations_by_day', { since: thirtyDaysAgo }),
    ]);

    return {
      activeListings: activeListings ?? 0,
      newListingsToday: newListingsToday ?? 0,
      enquiriesThisWeek: enquiriesThisWeek ?? 0,
      newUsersToday: newUsersToday ?? 0,
      unreadEnquiries: unreadEnquiries ?? 0,
      featuredListings: featuredListings ?? 0,
      listingsByStatus: listingsByStatus ?? [],
      topSuburbs: topSuburbs ?? [],
      enquiriesLast30Days: enquiriesByDay ?? [],
      registrationsLast30Days: registrationsByDay ?? [],
    };
  }

  // ── Properties ─────────────────────────────────────────────────────────
  async getProperty(id: string) {
    const { data, error } = await this.supabase.client
      .from('properties')
      .select(
        'id, headline, suburb, state, listing_type, property_type, status, sale_method, price, price_min, price_max, price_display, is_price_hidden, auction_at, description, unit_number, street_number, street_name, postcode, lat, lng, bedrooms, bathrooms, car_spaces, land_size_sqm, build_size_sqm, agent_id, agency_id, view_count, enquiry_count, is_featured, published_at, created_at',
      )
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  async listProperties(params: {
    page?: number;
    listingType?: string;
    status?: string;
    suburb?: string;
    agentId?: string;
    isFeatured?: boolean;
  }) {
    const page = params.page ?? 1;
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = this.supabase.client
      .from('properties')
      .select(
        'id, headline, suburb, state, listing_type, property_type, status, price, price_display, is_price_hidden, agent_id, agency_id, view_count, enquiry_count, is_featured, published_at, created_at',
        { count: 'exact' },
      )
      .order('created_at', { ascending: false })
      .range(from, to);

    if (params.listingType) query = query.eq('listing_type', params.listingType);
    if (params.status) query = query.eq('status', params.status);
    if (params.suburb) query = query.ilike('suburb', `%${params.suburb}%`);
    if (params.agentId) query = query.eq('agent_id', params.agentId);
    if (params.isFeatured !== undefined) query = query.eq('is_featured', params.isFeatured);

    const { data, count, error } = await query;
    if (error) throw error;

    const total = count ?? 0;
    return { items: data ?? [], total, page, totalPages: Math.ceil(total / PAGE_SIZE) };
  }

  async createProperty(data: Record<string, unknown>, actor: AdminProfile) {
    const { data: created, error } = await this.supabase.client
      .from('properties')
      .insert(data)
      .select('id')
      .single();
    if (error) throw error;
    const id = (created as { id: string }).id;
    await this.audit(actor, 'property.create', { id });
    return { id };
  }

  async updateProperty(id: string, patch: Record<string, unknown>, actor: AdminProfile) {
    const { error } = await this.supabase.client.from('properties').update(patch).eq('id', id);
    if (error) throw error;
    await this.audit(actor, 'property.update', { id, patch });
    return { success: true };
  }

  async deleteProperty(id: string, actor: AdminProfile) {
    const { error } = await this.supabase.client.from('properties').delete().eq('id', id);
    if (error) throw error;
    await this.audit(actor, 'property.delete', { id });
    return { success: true };
  }

  async bulkUpdateProperties(ids: string[], patch: Record<string, unknown>, actor: AdminProfile) {
    const { error } = await this.supabase.client.from('properties').update(patch).in('id', ids);
    if (error) throw error;
    await this.audit(actor, 'property.bulk_update', { ids, patch });
    return { success: true };
  }

  // ── Agencies ───────────────────────────────────────────────────────────
  async getAgency(id: string) {
    const { data, error } = await this.supabase.client
      .from('agencies')
      .select('id, name, slug, suburb, state, postcode, website, phone, logo_url')
      .eq('id', id)
      .single();
    if (error) throw error;
    const [{ count: agentCount }, { count: listingCount }] = await Promise.all([
      this.supabase.client.from('agents').select('*', { count: 'exact', head: true }).eq('agency_id', id),
      this.supabase.client.from('properties').select('*', { count: 'exact', head: true }).eq('agency_id', id).eq('status', 'active'),
    ]);
    return { ...data, agent_count: agentCount ?? 0, listing_count: listingCount ?? 0 };
  }

  async listAgencies(page = 1) {
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, count, error } = await this.supabase.client
      .from('agencies')
      .select('id, name, slug, suburb, state, website, phone, logo_url', { count: 'exact' })
      .order('name')
      .range(from, to);
    if (error) throw error;

    const items = data ?? [];
    const withCounts = await Promise.all(
      items.map(async (a) => {
        const agencyTyped = a as { id: string };
        const [{ count: agentCount }, { count: listingCount }] = await Promise.all([
          this.supabase.client.from('agents').select('*', { count: 'exact', head: true }).eq('agency_id', agencyTyped.id),
          this.supabase.client.from('properties').select('*', { count: 'exact', head: true }).eq('agency_id', agencyTyped.id).eq('status', 'active'),
        ]);
        return { ...a, agent_count: agentCount ?? 0, listing_count: listingCount ?? 0 };
      }),
    );

    const total = count ?? 0;
    return { items: withCounts, total, page, totalPages: Math.ceil(total / PAGE_SIZE) };
  }

  async createAgency(data: Record<string, unknown>, actor: AdminProfile) {
    const { data: created, error } = await this.supabase.client
      .from('agencies')
      .insert(data)
      .select('id')
      .single();
    if (error) throw error;
    const id = (created as { id: string }).id;
    await this.audit(actor, 'agency.create', { id });
    return { id };
  }

  async updateAgency(id: string, patch: Record<string, unknown>, actor: AdminProfile) {
    const { error } = await this.supabase.client.from('agencies').update(patch).eq('id', id);
    if (error) throw error;
    await this.audit(actor, 'agency.update', { id });
    return { success: true };
  }

  async deleteAgency(id: string, actor: AdminProfile) {
    const { count: agentCount } = await this.supabase.client
      .from('agents')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', id);
    if ((agentCount ?? 0) > 0) {
      throw new Error('Cannot delete agency with linked agents');
    }
    const { error } = await this.supabase.client.from('agencies').delete().eq('id', id);
    if (error) throw error;
    await this.audit(actor, 'agency.delete', { id });
    return { success: true };
  }

  // ── Agents ─────────────────────────────────────────────────────────────
  async getAgent(id: string) {
    const { data, error } = await this.supabase.client
      .from('agents')
      .select('id, profile_id, agency_id, license_no, years_active, is_active, bio')
      .eq('id', id)
      .single();
    if (error) throw error;
    const agentTyped = data as { id: string; profile_id: string; agency_id: string };
    const [{ data: profile }, { data: agency }, { count: listingCount }] = await Promise.all([
      this.supabase.client.from('profiles').select('full_name, email').eq('id', agentTyped.profile_id).single(),
      this.supabase.client.from('agencies').select('name').eq('id', agentTyped.agency_id).single(),
      this.supabase.client.from('properties').select('*', { count: 'exact', head: true }).eq('agent_id', id).eq('status', 'active'),
    ]);
    return {
      ...data,
      full_name: (profile as { full_name: string | null } | null)?.full_name ?? null,
      email: (profile as { email: string } | null)?.email ?? '',
      agency_name: (agency as { name: string } | null)?.name ?? '',
      active_listings: listingCount ?? 0,
    };
  }

  async listAgents(page = 1) {
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, count, error } = await this.supabase.client
      .from('agents')
      .select('id, profile_id, agency_id, license_no, years_active, is_active', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);
    if (error) throw error;

    const items = data ?? [];
    const enriched = await Promise.all(
      items.map(async (a) => {
        const agentTyped = a as { id: string; profile_id: string; agency_id: string };
        const [{ data: profile }, { data: agency }, { count: listingCount }] = await Promise.all([
          this.supabase.client.from('profiles').select('full_name, email').eq('id', agentTyped.profile_id).single(),
          this.supabase.client.from('agencies').select('name').eq('id', agentTyped.agency_id).single(),
          this.supabase.client.from('properties').select('*', { count: 'exact', head: true }).eq('agent_id', agentTyped.id).eq('status', 'active'),
        ]);
        return {
          ...a,
          full_name: (profile as { full_name: string | null } | null)?.full_name ?? null,
          email: (profile as { email: string } | null)?.email ?? '',
          agency_name: (agency as { name: string } | null)?.name ?? '',
          active_listings: listingCount ?? 0,
        };
      }),
    );

    const total = count ?? 0;
    return { items: enriched, total, page, totalPages: Math.ceil(total / PAGE_SIZE) };
  }

  async createAgent(data: Record<string, unknown>, actor: AdminProfile) {
    const profileEmail = data['profile_email'] as string | undefined;
    let profileId: string | undefined;

    if (profileEmail) {
      const { data: profile } = await this.supabase.client
        .from('profiles')
        .select('id')
        .eq('email', profileEmail)
        .single();
      if (!profile) throw new NotFoundException('Profile not found for that email');
      profileId = (profile as { id: string }).id;
    }

    const { profile_email: _, ...rest } = data;
    const { data: created, error } = await this.supabase.client
      .from('agents')
      .insert({ ...rest, profile_id: profileId })
      .select('id')
      .single();
    if (error) throw error;
    const id = (created as { id: string }).id;
    await this.audit(actor, 'agent.create', { id });
    return { id };
  }

  async updateAgent(id: string, patch: Record<string, unknown>, actor: AdminProfile) {
    const { error } = await this.supabase.client.from('agents').update(patch).eq('id', id);
    if (error) throw error;
    await this.audit(actor, 'agent.update', { id });
    return { success: true };
  }

  // ── Users ──────────────────────────────────────────────────────────────
  async listUsers(params: { page?: number; role?: string; search?: string }) {
    const page = params.page ?? 1;
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = this.supabase.client
      .from('profiles')
      .select('id, email, full_name, role, phone, created_at, is_suspended', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (params.role) query = query.eq('role', params.role);
    if (params.search) {
      query = query.or(`email.ilike.%${params.search}%,full_name.ilike.%${params.search}%`);
    }

    const { data, count, error } = await query;
    if (error) throw error;

    const items = data ?? [];
    const enriched = await Promise.all(
      items.map(async (u) => {
        const userTyped = u as { id: string };
        const [{ count: collectionsCount }, { count: searchesCount }, { count: enquiriesCount }] =
          await Promise.all([
            this.supabase.client.from('collections').select('*', { count: 'exact', head: true }).eq('user_id', userTyped.id),
            this.supabase.client.from('saved_searches').select('*', { count: 'exact', head: true }).eq('user_id', userTyped.id),
            this.supabase.client.from('enquiries').select('*', { count: 'exact', head: true }).eq('sender_id', userTyped.id),
          ]);
        return {
          ...u,
          collections_count: collectionsCount ?? 0,
          saved_searches_count: searchesCount ?? 0,
          enquiries_count: enquiriesCount ?? 0,
        };
      }),
    );

    const total = count ?? 0;
    return { items: enriched, total, page, totalPages: Math.ceil(total / PAGE_SIZE) };
  }

  async updateUser(id: string, patch: { role?: string; is_suspended?: boolean }, actor: AdminProfile) {
    const { error } = await this.supabase.client.from('profiles').update(patch).eq('id', id);
    if (error) throw error;
    await this.audit(actor, 'user.update', { id, patch });
    return { success: true };
  }

  async getUserById(id: string) {
    const { data, error } = await this.supabase.client
      .from('profiles')
      .select('id, email, full_name, role, phone, created_at, is_suspended')
      .eq('id', id)
      .single();
    if (error) throw new NotFoundException('User not found');
    const u = data as { id: string };
    const [{ count: collectionsCount }, { count: searchesCount }, { count: enquiriesCount }] =
      await Promise.all([
        this.supabase.client.from('collections').select('*', { count: 'exact', head: true }).eq('user_id', u.id),
        this.supabase.client.from('saved_searches').select('*', { count: 'exact', head: true }).eq('user_id', u.id),
        this.supabase.client.from('enquiries').select('*', { count: 'exact', head: true }).eq('sender_id', u.id),
      ]);
    return {
      ...data,
      collections_count: collectionsCount ?? 0,
      saved_searches_count: searchesCount ?? 0,
      enquiries_count: enquiriesCount ?? 0,
    };
  }

  // ── Suburbs ────────────────────────────────────────────────────────────
  async listSuburbs(page = 1) {
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, count, error } = await this.supabase.client
      .from('suburbs')
      .select('id, name, state, postcode, median_sale_price, median_rent_price, days_on_market_avg, stats_updated_at', { count: 'exact' })
      .order('name')
      .range(from, to);
    if (error) throw error;

    const total = count ?? 0;
    return { items: data ?? [], total, page, totalPages: Math.ceil(total / PAGE_SIZE) };
  }

  async createSuburb(data: Record<string, unknown>, actor: AdminProfile) {
    const { data: created, error } = await this.supabase.client
      .from('suburbs')
      .insert(data)
      .select('id')
      .single();
    if (error) throw error;
    const id = (created as { id: string }).id;
    await this.audit(actor, 'suburb.create', { id });
    return { id };
  }

  async updateSuburb(id: string, patch: Record<string, unknown>, actor: AdminProfile) {
    const { error } = await this.supabase.client.from('suburbs').update(patch).eq('id', id);
    if (error) throw error;
    await this.audit(actor, 'suburb.update', { id });
    return { success: true };
  }

  async refreshSuburbStats(id: string, actor: AdminProfile) {
    await this.supabase.client.rpc('refresh_suburb_stats', { suburb_id: id });
    await this.audit(actor, 'suburb.refresh_stats', { id });
    return { success: true };
  }

  // ── Schools ────────────────────────────────────────────────────────────
  async listSchools(page = 1) {
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, count, error } = await this.supabase.client
      .from('schools')
      .select('id, name, type, sector, suburb, state, postcode, rating, lat, lng', { count: 'exact' })
      .order('name')
      .range(from, to);
    if (error) throw error;

    const total = count ?? 0;
    return { items: data ?? [], total, page, totalPages: Math.ceil(total / PAGE_SIZE) };
  }

  async createSchool(data: Record<string, unknown>, actor: AdminProfile) {
    const { data: created, error } = await this.supabase.client
      .from('schools')
      .insert(data)
      .select('id')
      .single();
    if (error) throw error;
    const id = (created as { id: string }).id;
    await this.audit(actor, 'school.create', { id });
    return { id };
  }

  async updateSchool(id: string, patch: Record<string, unknown>, actor: AdminProfile) {
    const { error } = await this.supabase.client.from('schools').update(patch).eq('id', id);
    if (error) throw error;
    await this.audit(actor, 'school.update', { id });
    return { success: true };
  }

  async deleteSchool(id: string, actor: AdminProfile) {
    const { error } = await this.supabase.client.from('schools').delete().eq('id', id);
    if (error) throw error;
    await this.audit(actor, 'school.delete', { id });
    return { success: true };
  }

  async importSchoolsCsv(rows: Record<string, unknown>[], actor: AdminProfile) {
    const { error } = await this.supabase.client.from('schools').upsert(rows, { onConflict: 'name,suburb,state' });
    if (error) throw error;
    await this.audit(actor, 'school.csv_import', { count: rows.length });
    return { imported: rows.length };
  }

  // ── Enquiries ──────────────────────────────────────────────────────────
  async listEnquiries(params: { page?: number; status?: string; agentId?: string }) {
    const page = params.page ?? 1;
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = this.supabase.client
      .from('enquiries')
      .select('id, sender_id, sender_name, sender_email, property_id, agent_id, status, message, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (params.status) query = query.eq('status', params.status);
    if (params.agentId) query = query.eq('agent_id', params.agentId);

    const { data, count, error } = await query;
    if (error) throw error;

    const items = data ?? [];
    const enriched = await Promise.all(
      items.map(async (e) => {
        const eTyped = e as {
          id: string;
          sender_id: string | null;
          sender_name: string | null;
          sender_email: string | null;
          property_id: string;
          agent_id: string | null;
        };

        // Resolve sender display — direct columns first, profile fallback for old rows
        const senderProfilePromise = (!eTyped.sender_name && eTyped.sender_id)
          ? this.supabase.client.from('profiles').select('full_name, email').eq('id', eTyped.sender_id).single()
          : Promise.resolve({ data: null });

        const [{ data: property }, { data: senderProfile }, { data: agentProfile }] = await Promise.all([
          this.supabase.client.from('properties').select('headline, suburb, state').eq('id', eTyped.property_id).single(),
          senderProfilePromise,
          eTyped.agent_id
            ? (async () => {
                const { data: ag } = await this.supabase.client
                  .from('agents')
                  .select('profile_id')
                  .eq('id', eTyped.agent_id)
                  .single();
                if (!ag) return { data: null };
                return this.supabase.client
                  .from('profiles')
                  .select('full_name')
                  .eq('id', (ag as { profile_id: string }).profile_id)
                  .single();
              })()
            : Promise.resolve({ data: null }),
        ]);

        const p = property as { headline: string | null; suburb: string; state: string } | null;
        const sp = senderProfile as { full_name: string | null; email: string } | null;
        const resolvedEmail = eTyped.sender_email ?? sp?.email ?? '';
        return {
          ...e,
          sender_name: eTyped.sender_name ?? sp?.full_name ?? resolvedEmail,
          sender_email: resolvedEmail,
          property_address: p ? `${p.headline ?? ''} ${p.suburb}, ${p.state}` : '',
          agent_name: (agentProfile as { full_name: string | null } | null)?.full_name ?? null,
        };
      }),
    );

    const total = count ?? 0;
    return { items: enriched, total, page, totalPages: Math.ceil(total / PAGE_SIZE) };
  }

  async updateEnquiryStatus(id: string, status: string, actor: AdminProfile) {
    const { error } = await this.supabase.client.from('enquiries').update({ status }).eq('id', id);
    if (error) throw error;
    await this.audit(actor, 'enquiry.status_change', { id, status });
    return { success: true };
  }

  // ── Notifications ──────────────────────────────────────────────────────
  async listNotifications(params: { page?: number; type?: string }) {
    const page = params.page ?? 1;
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = this.supabase.client
      .from('notifications')
      .select('id, user_id, type, title, body, read, sent_at', { count: 'exact' })
      .order('sent_at', { ascending: false })
      .range(from, to);

    if (params.type) query = query.eq('type', params.type);

    const { data, count, error } = await query;
    if (error) throw error;

    const items = data ?? [];
    const enriched = await Promise.all(
      items.map(async (n) => {
        const { data: profile } = await this.supabase.client
          .from('profiles')
          .select('email')
          .eq('id', (n as { user_id: string }).user_id)
          .single();
        return { ...n, user_email: (profile as { email: string } | null)?.email ?? '' };
      }),
    );

    const total = count ?? 0;
    return { items: enriched, total, page, totalPages: Math.ceil(total / PAGE_SIZE) };
  }

  async broadcastNotification(data: { title: string; body: string }, actor: AdminProfile) {
    const { data: users } = await this.supabase.client
      .from('profiles')
      .select('id')
      .neq('role', 'admin');

    const rows = (users ?? []).map((u) => ({
      user_id: (u as { id: string }).id,
      type: 'announcement',
      title: data.title,
      body: data.body,
      read: false,
      sent_at: new Date().toISOString(),
    }));

    if (rows.length) {
      const { error } = await this.supabase.client.from('notifications').insert(rows);
      if (error) throw error;
    }

    await this.audit(actor, 'notification.broadcast', { title: data.title, count: rows.length });
    return { success: true, count: rows.length };
  }

  // ── Media ──────────────────────────────────────────────────────────────
  async getMediaSummary() {
    const { data: allImages } = await this.supabase.client
      .from('property_images')
      .select('id, property_id, created_at');

    const total = allImages?.length ?? 0;
    const orphaned = (allImages ?? []).filter((i) => !(i as { property_id: string | null }).property_id);

    return {
      totalFiles: total,
      totalSizeBytes: 0,
      orphanedCount: orphaned.length,
    };
  }

  async listMediaFiles(page = 1) {
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, count, error } = await this.supabase.client
      .from('property_images')
      .select('id, property_id, storage_path, cdn_url, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);
    if (error) throw error;

    const items = (data ?? []).map((img) => {
      const typed = img as { id: string; property_id: string | null; storage_path: string; cdn_url: string; created_at: string };
      return {
        ...img,
        property_address: null,
        is_orphaned: !typed.property_id,
      };
    });

    const total = count ?? 0;
    return { items, total, page, totalPages: Math.ceil(total / PAGE_SIZE) };
  }

  async deleteOrphanedMedia(actor: AdminProfile) {
    const { data: orphaned } = await this.supabase.client
      .from('property_images')
      .select('id')
      .is('property_id', null);

    const ids = (orphaned ?? []).map((i) => (i as { id: string }).id);
    if (ids.length) {
      await this.supabase.client.from('property_images').delete().in('id', ids);
    }

    await this.audit(actor, 'media.delete_orphaned', { count: ids.length });
    return { deleted: ids.length };
  }

  // ── Featured ───────────────────────────────────────────────────────────
  async listFeatured() {
    const { data, error } = await this.supabase.client
      .from('properties')
      .select('id, headline, suburb, state, listing_type, property_type, status, price, price_display, is_price_hidden, agent_id, agency_id, view_count, enquiry_count, is_featured, published_at, created_at, feature_order')
      .eq('is_featured', true)
      .order('feature_order', { ascending: true, nullsFirst: false });
    if (error) throw error;
    return { items: data ?? [] };
  }

  async reorderFeatured(ids: string[], actor: AdminProfile) {
    await Promise.all(
      ids.map((id, index) =>
        this.supabase.client.from('properties').update({ feature_order: index }).eq('id', id),
      ),
    );
    await this.audit(actor, 'featured.reorder', { count: ids.length });
    return { success: true };
  }

  // ── Analytics ──────────────────────────────────────────────────────────
  async getListingAnalytics() {
    const [{ data: mostViewed }, { data: highestEnquiry }] = await Promise.all([
      this.supabase.client
        .from('properties')
        .select('id, headline, view_count')
        .order('view_count', { ascending: false })
        .limit(10),
      this.supabase.client
        .from('properties')
        .select('id, headline, enquiry_count')
        .order('enquiry_count', { ascending: false })
        .limit(10),
    ]);

    const { data: soldProperties } = await this.supabase.client
      .from('properties')
      .select('published_at, sold_at')
      .eq('status', 'sold')
      .not('sold_at', 'is', null)
      .not('published_at', 'is', null);

    let avgDaysToSold = 0;
    if (soldProperties?.length) {
      const total = soldProperties.reduce((sum, p) => {
        const typed = p as { published_at: string; sold_at: string };
        const days = (new Date(typed.sold_at).getTime() - new Date(typed.published_at).getTime()) / 86400000;
        return sum + days;
      }, 0);
      avgDaysToSold = Math.round(total / soldProperties.length);
    }

    return {
      mostViewed: mostViewed ?? [],
      highestEnquiryRate: highestEnquiry ?? [],
      avgDaysToSold,
    };
  }

  async getUserAnalytics() {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [{ count: dau }, { count: wau }, { count: mau }] = await Promise.all([
      this.supabase.client.from('search_history').select('user_id', { count: 'exact', head: true }).gte('created_at', dayAgo),
      this.supabase.client.from('search_history').select('user_id', { count: 'exact', head: true }).gte('created_at', weekAgo),
      this.supabase.client.from('search_history').select('user_id', { count: 'exact', head: true }).gte('created_at', monthAgo),
    ]);

    return { dau: dau ?? 0, wau: wau ?? 0, mau: mau ?? 0 };
  }

  async getSearchAnalytics() {
    const [{ data: suburbs }, { data: keywords }] = await Promise.all([
      this.supabase.client.rpc('admin_top_searched_suburbs', { limit_count: 10 }),
      this.supabase.client.rpc('admin_top_keywords', { limit_count: 10 }),
    ]);

    return {
      topSuburbs: suburbs ?? [],
      topKeywords: keywords ?? [],
    };
  }
}
