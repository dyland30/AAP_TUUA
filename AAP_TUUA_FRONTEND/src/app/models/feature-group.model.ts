import { Feature } from './feature.model';

export interface FeatureGroup {
  id: number;
  name: string | null;
  description: string | null;
  features: Feature[] | null;
  created_by: string | null;
  modified_by: string | null;
  created_date: string | null;
  modified_date: string | null;
}
