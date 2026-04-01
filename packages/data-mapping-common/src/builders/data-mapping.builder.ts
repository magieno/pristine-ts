import {DataMappingNode} from "../nodes/data-mapping.node";
import {DataNormalizerUniqueKey} from "../types/data-normalizer-unique-key.type";
import {DataNormalizerAlreadyAdded} from "../errors/data-normalizer-already-added.error";
import {DataMappingInterceptorUniqueKeyType} from "../types/data-mapping-interceptor-unique-key.type";
import {DataBeforeMappingInterceptorAlreadyAddedError} from "../errors/data-before-mapping-interceptor-already-added.error";
import {DataAfterMappingInterceptorAlreadyAddedError} from "../errors/data-after-mapping-interceptor-already-added.error";
import {DataMappingLeaf} from "../nodes/data-mapping.leaf";
import {BaseDataMappingNode} from "../nodes/base-data-mapping.node";
import {DataMappingNodeTypeEnum} from "../enums/data-mapping-node-type.enum";

export class DataMappingBuilder extends BaseDataMappingNode {
  public normalizers: { key: DataNormalizerUniqueKey, options: any }[] = [];
  public beforeMappingInterceptors: { key: DataMappingInterceptorUniqueKeyType, options: any }[] = [];
  public afterMappingInterceptors: { key: DataMappingInterceptorUniqueKeyType, options: any }[] = [];

  /**
   * This method adds a normalizer to the root that will be applied on each node (unless they explicitly exclude to do
   * so).
   *
   * @param normalizerUniqueKey
   * @param options
   */
  public addNormalizer(normalizerUniqueKey: DataNormalizerUniqueKey, options?: any): DataMappingBuilder {
    if (this.hasNormalizer(normalizerUniqueKey)) {
      throw new DataNormalizerAlreadyAdded("The data normalizer '" + normalizerUniqueKey + "' has already been added to this builder.", normalizerUniqueKey, options);
    }

    this.normalizers.push({
      key: normalizerUniqueKey,
      options,
    });
    return this;
  }

  /**
   * This method returns whether there's a normalizer for the specified key or not.
   *
   * @param normalizerUniqueKey
   */
  public hasNormalizer(normalizerUniqueKey: DataNormalizerUniqueKey): boolean {
    return this.normalizers.find(element => element.key === normalizerUniqueKey) !== undefined;
  }

  /**
   * This method adds an interceptor that will be executed **before** the object is mapped.
   *
   * @param key
   * @param options
   */
  public addBeforeMappingInterceptor(key: DataMappingInterceptorUniqueKeyType, options?: any): DataMappingBuilder {
    if (this.hasBeforeMappingInterceptor(key)) {
      throw new DataBeforeMappingInterceptorAlreadyAddedError("The before row transform interceptor has already been added to this Tree.", key, options)
    }

    this.beforeMappingInterceptors.push({
      key,
      options,
    });

    return this;
  }

  /**
   * This method returns whether a **before** interceptor already exists.
   * @param key
   */
  public hasBeforeMappingInterceptor(key: DataMappingInterceptorUniqueKeyType): boolean {
    return this.beforeMappingInterceptors.find(element => element.key === key) !== undefined;
  }

  /**
   * This method adds an interceptor that will be executed **after** the object is mapped.
   *
   * @param key
   * @param options
   */
  public addAfterMappingInterceptor(key: DataMappingInterceptorUniqueKeyType, options?: any): DataMappingBuilder {
    if (this.hasAfterMappingInterceptor(key)) {
      throw new DataAfterMappingInterceptorAlreadyAddedError("The after row transform interceptor has already been added to this Tree.", key, options)
    }

    this.afterMappingInterceptors.push({
      key,
      options,
    });

    return this;
  }

  /**
   * This method returns whether a **after** interceptor already exists.
   * @param key
   */
  public hasAfterMappingInterceptor(key: DataMappingInterceptorUniqueKeyType): boolean {
    return this.afterMappingInterceptors.find(element => element.key === key) !== undefined;
  }

  /**
   * This property creates a new DataMappingLeaf and returns it. It doesn't add it yet. To do so, the `end()` method
   * must be called.
   */
  public add() {
    return new DataMappingLeaf(this, this);
  }

  /**
   * This method adds a nesting level. This should be used when the property contains an object and you want to map
   * this object into another object.
   */
  public addNestingLevel() {
    return new DataMappingNode(this, this);
  }

  /**
   * This method adds an array of Scalar allowing you to apply the normalizer on each scalar in the array. The
   * `sourceProperty` and `destinationProperty` correspond to the name of the property that is an array. But, the
   * values in the array will be normalized using the normalizer.
   *
   */
  public addArrayOfScalar(): DataMappingLeaf {
    return new DataMappingLeaf(this, this, DataMappingNodeTypeEnum.ScalarArray);
  }

  /**
   * This method adds an array of objects allowing to define a node for each property in the object. Each object in
   * the array will be treated as being the same.
   */
  public addArrayOfObjects(): DataMappingNode {
    return new DataMappingNode(this, this, DataMappingNodeTypeEnum.ObjectArray);
  }

  /**
   * This method is called at the end just to make it nice since all the nodes will have one, it's nice
   * that the builder has one too.
   */
  public end(): DataMappingBuilder {
    return this;
  }

  /**
   * This method imports a schema.
   *
   * @param schema
   */
  public import(schema: any) {
    this.normalizers = schema.normalizers;
    this.beforeMappingInterceptors = schema.beforeMappingInterceptors;
    this.afterMappingInterceptors = schema.afterMappingInterceptors;

    const nodes = schema.nodes;

    for (const key in nodes) {
      if (nodes.hasOwnProperty(key) === false) {
        continue;
      }

      const nodeInfo = nodes[key];

      const type: DataMappingNodeTypeEnum = nodeInfo["_type"];

      switch (type) {
        case DataMappingNodeTypeEnum.ScalarArray:
        case DataMappingNodeTypeEnum.Leaf:
          const leaf = new DataMappingLeaf(this, this, type);
          leaf.import(nodeInfo);
          this.nodes[leaf.sourceProperty] = leaf;
          continue;

        case DataMappingNodeTypeEnum.Node:
        case DataMappingNodeTypeEnum.ObjectArray:
          const node = new DataMappingNode(this, this, type);
          node.import(nodeInfo);
          this.nodes[node.sourceProperty] = node;
          ;
      }
    }
  }

  /**
   * This method exports this node.
   */
  public export() {
    const nodes = this.nodes;

    for (const key in nodes) {
      if (nodes.hasOwnProperty(key) === false) {
        continue;
      }

      nodes[key] = nodes[key].export();
    }

    return {
      "nodes": nodes,
      "normalizers": this.normalizers,
      "beforeMappingInterceptors": this.beforeMappingInterceptors,
      "afterMappingInterceptors": this.afterMappingInterceptors,

    }
  }
}