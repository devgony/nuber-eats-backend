import { Inject, Injectable } from '@nestjs/common';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { EmailVar, MailModuleOptions } from './mail.interfaces';
import got from 'got';
import * as FormData from 'form-data';

@Injectable()
export class MailService {
  constructor(
    @Inject(CONFIG_OPTIONS) private readonly options: MailModuleOptions, // we can inject whatever
  ) {
    // this.sendEmail('testing', 'verify-email');
  }

  // with private, we can't test
  async sendEmail(
    subject: string,
    template: string,
    emailVars: EmailVar[],
  ): Promise<Boolean> {
    const form = new FormData();
    form.append(
      'from',
      `Henry from Nuber Eats <mailgun@${this.options.domain}>`,
    );
    form.append('to', 'devgony@gmail.com');
    form.append('subject', subject);
    form.append('template', template);
    emailVars.forEach(eVar => form.append(`v:${eVar.key}`, eVar.value));
    try {
      // to mock and test failure, add .post
      await got.post(
        `https://api.mailgun.net/v3/${this.options.domain}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${Buffer.from(
              `api:${this.options.apiKey}`,
            ).toString('base64')}`,
          },
          body: form,
        },
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  sendVerificationEmail(email: string, code: string) {
    this.sendEmail('Verify Your Email', 'verify-email', [
      { key: 'username', value: email },
      { key: 'code', value: code },
    ]);
  }
}
