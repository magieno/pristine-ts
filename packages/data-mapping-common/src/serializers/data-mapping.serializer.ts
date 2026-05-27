import {DataMappingNodeTypeEnum} from "../enums/data-mapping-node-type.enum";
import {DataMappingNode} from "../nodes/data-mapping.node";
import {DataMappingLeaf} from "../nodes/data-mapping.leaf";
import {DataMappingBuilder} from "../builders/data-mapping.builder";

/**
 * Pure helpers for serializing / deserializing the children-map shared between
 * `DataMappingBuilder` and `DataMappingNode`.
 *
 * Both classes hold the same `{ [sourceProperty]: DataMappingNode | DataMappingLeaf }` shape
 * and both need to walk it the same way during `import()` / `export()`. Keeping that walk in
 * one place avoids the two implementations drifting apart (which they already had — see the
 * old destination-property-leak bug).
 *
 * Stateless class-as-namespace per the project convention (no constructor dependencies, no
 * instance state, so static methods make the call site read straight: `DataMappingSerializer.
 * importChildren(...)`).
 *
 * Note on imports: this module is in a small cycle with `data-mapping.node.ts` — the
 * serializer references Node and Leaf so it can instantiate them, and Node references the
 * serializer so its `import()` / `export()` can delegate. The cycle resolves cleanly because
 * the references are used only inside method bodies (not at module top level), so by the
 * time anything runs both modules are fully evaluated.
 */
export class DataMappingSerializer {
  /**
   * Rebuild a populated children map from the `nodes` field of a serialized schema.
   *
   * Dispatches on the `_type` discriminator: ScalarArray + Leaf hydrate as `DataMappingLeaf`,
   * Node + ObjectArray hydrate as `DataMappingNode`. The created child's own `import()` is
   * called to fill in its fields and (for nodes) recurse into its own children.
   */
  public static importChildren(
    root: DataMappingBuilder,
    parent: DataMappingBuilder | DataMappingNode,
    schemaNodes: { [key: string]: any } | undefined,
  ): { [sourceProperty: string]: DataMappingNode | DataMappingLeaf } {
    const result: { [sourceProperty: string]: DataMappingNode | DataMappingLeaf } = {};

    if (schemaNodes === undefined || schemaNodes === null) {
      return result;
    }

    for (const key in schemaNodes) {
      if (schemaNodes.hasOwnProperty(key) === false) {
        continue;
      }

      const nodeInfo = schemaNodes[key];
      const type: DataMappingNodeTypeEnum = nodeInfo["_type"];

      switch (type) {
        case DataMappingNodeTypeEnum.ScalarArray:
        case DataMappingNodeTypeEnum.Leaf: {
          const leaf = new DataMappingLeaf(root, parent, type);
          leaf.import(nodeInfo);
          result[leaf.sourceProperty] = leaf;
          break;
        }

        case DataMappingNodeTypeEnum.Node:
        case DataMappingNodeTypeEnum.ObjectArray: {
          const node = new DataMappingNode(root, parent, type);
          node.import(nodeInfo);
          result[node.sourceProperty] = node;
          break;
        }
      }
    }

    return result;
  }

  /**
   * Serialize a children map back into a plain `nodes` object suitable for embedding in a
   * schema export. Returns a fresh object — does not mutate the input, so callers can safely
   * continue to use the live tree after exporting.
   */
  public static exportChildren(
    nodes: { [sourceProperty: string]: DataMappingNode | DataMappingLeaf },
  ): { [key: string]: any } {
    const result: { [key: string]: any } = {};

    for (const key in nodes) {
      if (nodes.hasOwnProperty(key) === false) {
        continue;
      }

      result[key] = nodes[key].export();
    }

    return result;
  }
}
