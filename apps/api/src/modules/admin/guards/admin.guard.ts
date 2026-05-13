import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../../../database/supabase.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<{ headers: Record<string, string>; adminUser?: unknown }>();

    const token = request.headers['authorization']?.replace('Bearer ', '');
    if (!token) throw new UnauthorizedException();

    const { data, error } = await this.supabase.client.auth.getUser(token);
    if (error || !data.user) throw new UnauthorizedException();

    const { data: profile } = await this.supabase.client
      .from('profiles')
      .select('id, role, full_name, email')
      .eq('id', data.user.id)
      .single();

    if (!profile || (profile as { role: string }).role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }

    request.adminUser = profile;
    return true;
  }
}
