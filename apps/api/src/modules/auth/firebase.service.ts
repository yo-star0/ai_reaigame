import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private initialized = false;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const projectId = this.config.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.config.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.config.get<string>('FIREBASE_PRIVATE_KEY');

    if (!projectId || !clientEmail || !privateKey) {
      this.logger.warn(
        'Firebase credentials not provided; running in DEV BYPASS mode. ' +
          'Requests will be authenticated via "Authorization: Bearer dev:<uid>".',
      );
      return;
    }

    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
    }
    this.initialized = true;
    this.logger.log(`Firebase Admin initialized (project=${projectId})`);
  }

  get isDevBypass(): boolean {
    return !this.initialized;
  }

  async verifyIdToken(token: string): Promise<{ uid: string; email?: string }> {
    if (this.isDevBypass) {
      if (!token.startsWith('dev:')) {
        throw new Error('DEV bypass requires token of form "dev:<uid>"');
      }
      return { uid: token.slice(4) };
    }
    const decoded = await admin.auth().verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email };
  }
}
