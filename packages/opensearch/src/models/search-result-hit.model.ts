export class SearchResultHit<T> {
  score: number = 0;
  id: number = 0;
  index: string = "";
  data?: T;
}
