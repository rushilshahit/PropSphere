import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { configuration } from './config/configuration';
import { SupabaseService } from './database/supabase.service';
import { CollectionsModule } from './modules/collections/collections.module';
import { EnquiriesModule } from './modules/enquiries/enquiries.module';
import { HomeModule } from './modules/home/home.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { SavedSearchesModule } from './modules/saved-searches/saved-searches.module';
import { SchoolsModule } from './modules/schools/schools.module';
import { SuburbsModule } from './modules/suburbs/suburbs.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        connection: { url: config.get<string>('redis.url') ?? 'redis://localhost:6379' },
      }),
      inject: [ConfigService],
    }),
    HomeModule,
    SuburbsModule,
    PropertiesModule,
    EnquiriesModule,
    SchoolsModule,
    CollectionsModule,
    SavedSearchesModule,
    NotificationsModule,
  ],
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class AppModule {}
