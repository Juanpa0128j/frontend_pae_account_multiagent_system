import { apiClient } from '../core/apiClient';

export { apiClient } from '../core/apiClient';
export type { ApiError } from '../core/types';

export { IngestApiClient } from './ingestApiClient';
export { ProcessApiClient } from './processApiClient';
export { TaxApiClient } from './taxApiClient';
export { ReportApiClient } from './reportApiClient';
export { CompanyApiClient } from './companyApiClient';
export { ChatApiClient } from './chatApiClient';

import { IngestApiClient } from './ingestApiClient';
import { ProcessApiClient } from './processApiClient';
import { TaxApiClient } from './taxApiClient';
import { ReportApiClient } from './reportApiClient';
import { CompanyApiClient } from './companyApiClient';
import { ChatApiClient } from './chatApiClient';

export const ingestApiClient = new IngestApiClient(apiClient);
export const processApiClient = new ProcessApiClient(apiClient);
export const taxApiClient = new TaxApiClient(apiClient);
export const reportApiClient = new ReportApiClient(apiClient);
export const companyApiClient = new CompanyApiClient(apiClient);
export const chatApiClient = new ChatApiClient(apiClient);
