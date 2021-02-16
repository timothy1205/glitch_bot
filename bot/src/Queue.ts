export default class Queue {
  private head: QueueNode<any> | null;
  private tail: QueueNode<any> | null;

  constructor() {
    this.head = null;
    this.tail = null;
  }

  public enqueue(node: QueueNode<any>) {
    if (!this.head) {
      this.head = node;
    }

    if (this.tail) {
      this.tail.setNextNode(node);
    }

    this.tail = node;
  }

  public dequeue() {
    if (!this.head) {
      return;
    }

    let tempNode = this.head;
    this.head = this.head.getNextNode();

    return tempNode;
  }

  public remove(data: any | QueueNode<any>) {
    let node = this.head;
    let prev;

    while (node) {
      if (data instanceof QueueNode ? node === data : node.getData() === data) {
        if (prev) {
          prev.setNextNode(node.getNextNode());
        } else {
          // At head
          this.head = node.getNextNode();
        }
        return;
      }

      prev = node;
      node = node.getNextNode();
    }
  }
}

export class QueueNode<T> {
  private data: T;
  private nextNode: QueueNode<any> | null;

  constructor(inputData: T) {
    this.data = inputData;
    this.nextNode = null;
  }

  public getData() {
    return this.data;
  }

  public getNextNode() {
    return this.nextNode;
  }

  public setNextNode(node: QueueNode<any> | null) {
    this.nextNode = node;
  }
}
