export const NEXT_ACTION = 0;
export const BEST_GAME = 1;


export class MCTS = {

  task: Task;
  /**
  * config is a JSON object containing all of the configuration options.
  * round: number - number of rounds of MCTS to do before returning a result
  * result: number - one of NEXT_ACTION or BEST_GAME. NEXT_ACTION will return the best next move to make, BEST_GAME will return the best game found in simulations.
  */
  config: any;
  numRounds: number;
  constructor(task: Task, config:any){
    this.task = task;
  }
}

export class Node = {
  parent: ?Node;
  task: Task;
  visits: number;
  selection: Selection;
  totalValue: number;

}

interface Task{
  rollout () : number;
  getPossibleActions(): Array<any>;
  doAction(action: any): void;
}

interface Selection{
  select(children: Array<Node>): number;
}
