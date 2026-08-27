import { CallPrejoinPage } from './call/call-page'
import { DocumentChannelPage as DocumentChannelPageImpl } from './document-channel-page'
import { EmailChannelPage as EmailChannelPageImpl } from './email-channel-page'

export function EmailChannelPage() {
  return <EmailChannelPageImpl />
}

export function CallChannelPage() {
  return <CallPrejoinPage />
}

export function DocumentChannelPage() {
  return <DocumentChannelPageImpl />
}
