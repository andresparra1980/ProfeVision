import { getPayload } from 'payload';
import config from '@/payload.config';

// Get Payload instance for server-side data fetching
export const getPayloadClient = async () => {
    return await getPayload({ config });
};
