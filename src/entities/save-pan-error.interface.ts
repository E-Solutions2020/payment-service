import { PanError } from './pan-error'

export interface SavePanError {
  pan: PanError['pan']
  status: PanError['status']
}
