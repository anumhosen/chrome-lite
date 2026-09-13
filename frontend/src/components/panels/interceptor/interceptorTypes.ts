export interface RequestItem {
  id: string;
  url: string;
  method: string;
  status?: number;
  statusText?: string;
  headers?: string;
  responseHeaders?: string;
  post_data?: string;
  body?: string;
  duration?: number;
}

export interface MockRule {
  id?: string;
  name: string;
  url_pattern: string;
  method: string;
  action: 'mock_response' | 'modify_headers' | 'block';
  response_status?: number;
  response_headers?: string;
  response_body?: string;
  enabled: number | boolean;
}
