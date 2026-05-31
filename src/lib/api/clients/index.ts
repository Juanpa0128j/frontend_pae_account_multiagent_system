import { apiClient } from '../core/apiClient';

export { apiClient } from '../core/apiClient';
export type { ApiError } from '../core/types';

export { IngestApiClient } from './ingestApiClient';
export { ProcessApiClient } from './processApiClient';
export { ReportApiClient } from './reportApiClient';
export { TaxApiClient } from './taxApiClient';
export { CompanyApiClient } from './companyApiClient';
export { ChatApiClient } from './chatApiClient';
export { EvaluationApiClient } from './evaluationApiClient';

import { IngestApiClient } from './ingestApiClient';
import { ProcessApiClient } from './processApiClient';
import { ReportApiClient } from './reportApiClient';
import { TaxApiClient } from './taxApiClient';
import { CompanyApiClient } from './companyApiClient';
import { ChatApiClient } from './chatApiClient';
import { EvaluationApiClient } from './evaluationApiClient';

export const ingestApiClient = new IngestApiClient(apiClient);
export const processApiClient = new ProcessApiClient(apiClient);
export const reportApiClient = new ReportApiClient(apiClient);
export const taxApiClient = new TaxApiClient(apiClient);
export const companyApiClient = new CompanyApiClient(apiClient);
export const chatApiClient = new ChatApiClient(apiClient);
export const evaluationApiClient = new EvaluationApiClient(apiClient);
