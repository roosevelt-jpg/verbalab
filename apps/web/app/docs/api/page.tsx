import type { Metadata } from 'next';
import { ApiReference } from './api-reference';

export const metadata: Metadata = {
  title: 'API reference',
  description:
    'Every Lugemi API endpoint — parameters, request bodies, responses, authentication, curl examples, and a live Try it console — generated from the live OpenAPI document.',
};

export default function ApiReferencePage() {
  return <ApiReference />;
}
