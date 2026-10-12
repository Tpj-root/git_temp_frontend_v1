// REGISTRY: one import per node file. To add a node: create graph/nodes/yourNode.ts and add it here.
import { NodeDef } from './types';
import { tickNode } from './nodes/tick';
import { candleNode } from './nodes/candle';
import { heikinAshiNode } from './nodes/heikinAshi';
import { extremumNode } from './nodes/extremum';
import { chandelierNode } from './nodes/chandelier';
import { delayNode } from './nodes/delay';
import { smaNode } from './nodes/sma';
import { emaNode } from './nodes/ema';
import { rsiNode } from './nodes/rsi';
import { bollingerNode } from './nodes/bollinger';
import { macdNode } from './nodes/macd';
import { logicGateNode } from './nodes/logicGate';
import { addNode, subNode, mulNode, divNode } from './nodes/mathOps';
import { incrementNode, decrementNode } from './nodes/counter';
import { formulaNode } from './nodes/formula';
import { functionNode } from './nodes/functionNode';
import { signalMarkerNode } from './nodes/signalMarker';
import { drawPointNode } from './nodes/drawPoint';
import { drawCandleNode } from './nodes/drawCandle';
import { positionNode } from './nodes/position';
import { trailingStopNode } from './nodes/trailingStop';
import { mainVariablesNode } from './nodes/mainVariables';
import { brokerSelectNode } from './nodes/brokerSelect';
import { autoTraderNode } from './nodes/autoTrader';
export const NODE_LIST: NodeDef[] = [tickNode, candleNode, heikinAshiNode, extremumNode, chandelierNode, delayNode, smaNode, emaNode, rsiNode,
  bollingerNode, macdNode, logicGateNode, addNode, subNode, mulNode, divNode, incrementNode, decrementNode, formulaNode, functionNode,
  signalMarkerNode, drawPointNode, drawCandleNode, positionNode, trailingStopNode, mainVariablesNode, brokerSelectNode, autoTraderNode];
export const NODE_DEFS: Record<string, NodeDef> = Object.fromEntries(NODE_LIST.map((d) => [d.type, d]));
