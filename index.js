import numeral from 'numeral';
//var MyWorker =
export const NEXT_ACTION = 0;
export const BEST_GAME = 1;

let cloneObject = function(obj){
  return JSON.parse(JSON.stringify(obj));
}

export default class MCTS{

  task: string;
  /**
  * config is a JSON object containing all of the configuration options.
  * round: number - number of rounds of MCTS to do before returning a result
  * result: number - one of NEXT_ACTION or BEST_GAME. NEXT_ACTION will return the best next move to make, BEST_GAME will return the best game found in simulations.
  * selection: number - one of the selection methods.
  */
  config: any;
  numRounds: number;
  progressListeners: Array;
  worker: any;
  treeData: any;
  constructor(task: string, config:any){
    this.task = task;
    this.config = config;
    if(config){
      this.numRounds = config.rounds || 1000;
      this.result = config.result || NEXT_ACTION;
    }
    else{
      this.numRounds = 1000;
      this.result = NEXT_ACTION;
    }

    this.progressListeners = [];
    var MyWorker = require("worker-loader!./node.js");
    this.worker = new MyWorker();
    this.worker.onmessage = function(event){
      var message = {};
      var data = JSON.parse(event.data);
      //console.log("received object in mcts");
      //console.log(data);
      if(data.progress=="done"){

        this.treeData = data.tree;
        //console.log("Received data in mcts");
        message = {progress: 'done'};
      }
      else if(data.progress=="progress"){
        //console.log("recieved progress");
        message = {progress: 'progress',round:data.round,best:numeral(data.best).format('0.00')};
      }
      this.progressListeners.map(fn=>{
        fn(message);
      });
    }.bind(this);

    //console.log("Rounds: "+this.numRounds);
  }

  getChildren(children,path,depth){
    var childs = [];
    if(depth>=path.length){
      return childs;
    }
    var index = path[depth];
    children.map((child,i)=>{
      if(index!=i){
        child.children = [];
      }
        child.children = this.getChildren(child.children,path,depth+1);
        childs.push(child);
    })
    return childs;
  }

  getTreeData(path){
    var indices = path.split(",");
    var treeData = cloneObject(this.treeData);
    var tree = [
      {
        name: 'Top Level',
        children: [],
        attributes: treeData[0].attributes,
        path: ""
      },
    ];
    var children = treeData[0].children;
    tree[0].children = this.getChildren(children,indices,0);
    return tree;
  }

  addProgressListener(fn){
    this.progressListeners.push(fn);
  }

  start(){


    var mcData = {message: 'start',task: this.task,config: this.config};
    this.worker.postMessage(mcData);

  }

  stop(){
    this.worker.terminate();
  }

}

interface Task{
  rollout () : number;
  getPossibleActions(): Array<any>;
  doAction(action: any): void;
  reset(): void;
}

interface Selection{
  select(children: Array<Node>): number;
}
