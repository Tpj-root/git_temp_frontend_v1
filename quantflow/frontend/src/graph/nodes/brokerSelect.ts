// BROKER SELECT NODE. Out: broker ("paper" | "mt5") -> AutoTrader.broker. Live mode switches the backend
// broker via POST /api/broker (only while flat and in manual mode). OFFLINE mode always uses the local paper broker.
import { NodeDef, P } from '../types';
export const brokerSelectNode: NodeDef = {
  type: 'brokerSelect', title: 'Broker Select', category: 'Trading', color: '#c084fc', description: 'Choose paper or MT5 execution.',
  inputs: [], outputs: [P('broker', 'broker', 'text')],
  params: [{ key: 'broker', label: 'broker', kind: 'select', default: 'paper', options: ['paper', 'mt5'] }],
  compute: (_i, p) => ({ broker: p.broker, _show: { broker: String(p.broker).toUpperCase() } }),
};
