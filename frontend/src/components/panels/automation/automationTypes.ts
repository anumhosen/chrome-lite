export interface AutomationStep {
  id?: string;
  type:
    | 'navigate'
    | 'click'
    | 'type'
    | 'wait'
    | 'scroll'
    | 'screenshot'
    | 'extract'
    | 'if_element_exists'
    | 'if_text_contains'
    | 'loop_elements';
  url?: string;
  selector?: string;
  value?: string;
  ms?: number;
  y?: number;
  text?: string;
  timeoutMs?: number;
  maxIterations?: number;
  thenAction?: 'click' | 'wait' | 'extract' | 'scroll';
  thenSelector?: string;
  thenValue?: string;
  loopAction?: 'click' | 'extract' | 'scroll';
}

export interface AutomationFlow {
  id?: string;
  name: string;
  steps: AutomationStep[];
  created_at?: number;
  updated_at?: number;
}

export interface StepProgress {
  stepIndex: number;
  totalSteps: number;
  status: 'running' | 'completed' | 'error';
  error?: string;
}
