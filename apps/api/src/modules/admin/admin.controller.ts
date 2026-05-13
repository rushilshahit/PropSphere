import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminGuard } from './guards/admin.guard';
import { AdminService } from './admin.service';

interface AdminRequest {
  adminUser: { id: string; full_name: string | null; email: string };
}

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ── Dashboard ──────────────────────────────────────────────────────────
  @Get('analytics/dashboard')
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  // ── Properties ─────────────────────────────────────────────────────────
  @Get('properties')
  listProperties(

    @Query('page') page?: string,
    @Query('listingType') listingType?: string,
    @Query('status') status?: string,
    @Query('suburb') suburb?: string,
    @Query('agentId') agentId?: string,
    @Query('isFeatured') isFeatured?: string,
  ) {
    return this.adminService.listProperties({
      page: page ? parseInt(page, 10) : undefined,
      listingType,
      status,
      suburb,
      agentId,
      isFeatured: isFeatured !== undefined ? isFeatured === 'true' : undefined,
    });
  }

  @Get('properties/:id')
  getProperty(@Param('id') id: string) {
    return this.adminService.getProperty(id);
  }

  @Post('properties')
  createProperty(@Req() req: AdminRequest, @Body() body: Record<string, unknown>) {
    return this.adminService.createProperty(body, req.adminUser);
  }

  @Patch('properties/bulk')
  bulkUpdateProperties(
    @Req() req: AdminRequest,
    @Body() body: { ids: string[] } & Record<string, unknown>,
  ) {
    const { ids, ...patch } = body;
    return this.adminService.bulkUpdateProperties(ids, patch, req.adminUser);
  }

  @Patch('properties/:id')
  updateProperty(
    @Req() req: AdminRequest,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.adminService.updateProperty(id, body, req.adminUser);
  }

  @Delete('properties/:id')
  deleteProperty(@Req() req: AdminRequest, @Param('id') id: string) {
    return this.adminService.deleteProperty(id, req.adminUser);
  }

  // ── Agencies ───────────────────────────────────────────────────────────
  @Get('agencies')
  listAgencies(@Query('page') page?: string) {
    return this.adminService.listAgencies(page ? parseInt(page, 10) : 1);
  }

  @Get('agencies/:id')
  getAgency(@Param('id') id: string) {
    return this.adminService.getAgency(id);
  }

  @Post('agencies')
  createAgency(@Req() req: AdminRequest, @Body() body: Record<string, unknown>) {
    return this.adminService.createAgency(body, req.adminUser);
  }

  @Patch('agencies/:id')
  updateAgency(
    @Req() req: AdminRequest,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.adminService.updateAgency(id, body, req.adminUser);
  }

  @Delete('agencies/:id')
  deleteAgency(@Req() req: AdminRequest, @Param('id') id: string) {
    return this.adminService.deleteAgency(id, req.adminUser);
  }

  // ── Agents ─────────────────────────────────────────────────────────────
  @Get('agents')
  listAgents(@Query('page') page?: string) {
    return this.adminService.listAgents(page ? parseInt(page, 10) : 1);
  }

  @Get('agents/:id')
  getAgent(@Param('id') id: string) {
    return this.adminService.getAgent(id);
  }

  @Post('agents')
  createAgent(@Req() req: AdminRequest, @Body() body: Record<string, unknown>) {
    return this.adminService.createAgent(body, req.adminUser);
  }

  @Patch('agents/:id')
  updateAgent(
    @Req() req: AdminRequest,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.adminService.updateAgent(id, body, req.adminUser);
  }

  // ── Users ──────────────────────────────────────────────────────────────
  @Get('users')
  listUsers(
    @Query('page') page?: string,
    @Query('role') role?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.listUsers({
      page: page ? parseInt(page, 10) : undefined,
      role,
      search,
    });
  }

  @Get('users/:id')
  getUser(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Patch('users/:id')
  updateUser(
    @Req() req: AdminRequest,
    @Param('id') id: string,
    @Body() body: { role?: string; is_suspended?: boolean },
  ) {
    return this.adminService.updateUser(id, body, req.adminUser);
  }

  // ── Suburbs ────────────────────────────────────────────────────────────
  @Get('suburbs')
  listSuburbs(@Query('page') page?: string) {
    return this.adminService.listSuburbs(page ? parseInt(page, 10) : 1);
  }

  @Post('suburbs')
  createSuburb(@Req() req: AdminRequest, @Body() body: Record<string, unknown>) {
    return this.adminService.createSuburb(body, req.adminUser);
  }

  @Patch('suburbs/:id')
  updateSuburb(
    @Req() req: AdminRequest,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.adminService.updateSuburb(id, body, req.adminUser);
  }

  @Post('suburbs/:id/refresh')
  refreshSuburbStats(@Req() req: AdminRequest, @Param('id') id: string) {
    return this.adminService.refreshSuburbStats(id, req.adminUser);
  }

  // ── Schools ────────────────────────────────────────────────────────────
  @Get('schools')
  listSchools(@Query('page') page?: string) {
    return this.adminService.listSchools(page ? parseInt(page, 10) : 1);
  }

  @Post('schools')
  createSchool(@Req() req: AdminRequest, @Body() body: Record<string, unknown>) {
    return this.adminService.createSchool(body, req.adminUser);
  }

  @Patch('schools/:id')
  updateSchool(
    @Req() req: AdminRequest,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.adminService.updateSchool(id, body, req.adminUser);
  }

  @Delete('schools/:id')
  deleteSchool(@Req() req: AdminRequest, @Param('id') id: string) {
    return this.adminService.deleteSchool(id, req.adminUser);
  }

  @Post('schools/import')
  @UseInterceptors(FileInterceptor('file'))
  async importSchoolsCsv(
    @Req() req: AdminRequest,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const text = file.buffer.toString('utf-8');
    const lines = text.trim().split('\n');
    const [headerLine, ...dataLines] = lines;
    const headers = headerLine.split(',').map((h) => h.trim());
    const rows = dataLines.map((line) => {
      const values = line.split(',');
      return Object.fromEntries(
        headers.map((h, i) => [h, values[i]?.trim() ?? null]),
      ) as Record<string, unknown>;
    });
    return this.adminService.importSchoolsCsv(rows, req.adminUser);
  }

  // ── Enquiries ──────────────────────────────────────────────────────────
  @Get('enquiries')
  listEnquiries(
    @Query('page') page?: string,
    @Query('status') status?: string,
    @Query('agentId') agentId?: string,
  ) {
    return this.adminService.listEnquiries({
      page: page ? parseInt(page, 10) : undefined,
      status,
      agentId,
    });
  }

  @Patch('enquiries/:id/status')
  updateEnquiryStatus(
    @Req() req: AdminRequest,
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.adminService.updateEnquiryStatus(id, body.status, req.adminUser);
  }

  // ── Notifications ──────────────────────────────────────────────────────
  @Get('notifications')
  listNotifications(
    @Query('page') page?: string,
    @Query('type') type?: string,
  ) {
    return this.adminService.listNotifications({
      page: page ? parseInt(page, 10) : undefined,
      type,
    });
  }

  @Post('notifications/broadcast')
  broadcastNotification(
    @Req() req: AdminRequest,
    @Body() body: { title: string; body: string },
  ) {
    return this.adminService.broadcastNotification(body, req.adminUser);
  }

  // ── Media ──────────────────────────────────────────────────────────────
  @Get('media/summary')
  getMediaSummary() {
    return this.adminService.getMediaSummary();
  }

  @Get('media')
  listMediaFiles(@Query('page') page?: string) {
    return this.adminService.listMediaFiles(page ? parseInt(page, 10) : 1);
  }

  @Delete('media/orphaned')
  deleteOrphanedMedia(@Req() req: AdminRequest) {
    return this.adminService.deleteOrphanedMedia(req.adminUser);
  }

  // ── Featured ───────────────────────────────────────────────────────────
  @Get('featured')
  listFeatured() {
    return this.adminService.listFeatured();
  }

  @Post('featured/reorder')
  reorderFeatured(@Req() req: AdminRequest, @Body() body: { ids: string[] }) {
    return this.adminService.reorderFeatured(body.ids, req.adminUser);
  }

  // ── Analytics ──────────────────────────────────────────────────────────
  @Get('analytics/listings')
  getListingAnalytics() {
    return this.adminService.getListingAnalytics();
  }

  @Get('analytics/users')
  getUserAnalytics() {
    return this.adminService.getUserAnalytics();
  }

  @Get('analytics/search')
  getSearchAnalytics() {
    return this.adminService.getSearchAnalytics();
  }
}
