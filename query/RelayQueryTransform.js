/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule RelayQueryTransform
 * @flow
 */

'use strict';

const RelayQueryVisitor = require('RelayQueryVisitor');

import type RelayQuery from 'RelayQuery';

/**
 * @internal
 *
 * `RelayQueryTransform` is a `RelayQueryVisitor` subclass that simplifies the
 * process of traversing, filtering, or transforming a Relay Query.
 *
 * The traversal is a map operation from `RelayQuery` nodes to nodes. The
 * default implementation traverses all nodes and maps each one to its
 * original value (ie. a no-op).
 *
 * Just like `RelayQueryVisitor`, subclasses of `RelayQueryTransform` can
 * optionally implement methods to customize the traversal and mapping of
 * different RelayQuery node types:
 *
 * - `visitField(field, state)`: Returns the new value for the visited field, or
 *   `null` to remove it from the output.
 * - `visitFragment(fragment, state)`: Returns the new value for the visited
 *   fragment, or `null` to remove it from the output.
 * - `visitQuery(fragment, state)`: Returns the new value for the top-level
 *   query, or `null` to transform the entire query out of existence.
 *
 * There are two additional methods for controlling the traversal:
 *
 * - `traverse(parent, state)`: Returns a cloned copy of the parent node after
 *   processing all of its children. Does not clone if nothing changed.
 * - `visit(child, state)`: Processes the child node, calling the appropriate
 *   `visit{Field,Fragment,Root` method based on the node type.
 *
 * All of these methods may return the original node in order to leave it
 * intact.
 *
 * @see RelayQueryVisitor
 */


//mutate the query as we go;
//  Greg Hurrell, relay deep dive / deepdive
//  RelayStore.primeCache

// Diff -> Split deffered (via RelayQueryTransform, traverse the query and split required and deffered queries) -> Subtract -> Print (we have an ast, but the graphql server doesn't speak ast, it speaks graphQL, so we print it)
// the RelayQueryTransform is the read-write version of RelayQueryVisitor, it is able to change the query based on wheter the fragment is required or deffered;
// RelayQueryVisitor ==> readRelayQueryData, RelayQueryWriter (write to store while reading the Query) ; RelayQueryTransform


class RelayQueryTransform<Ts> extends RelayQueryVisitor<Ts> {
  traverse<Tn: RelayQuery.Node>(
    node: Tn,
    nextState: Ts
  ): ?Tn {
    if (!node.canHaveSubselections()) {
      return node;
    }
    let nextChildren;
    this.traverseChildren(node, nextState, function(child, index, children) {
      const prevChild = children[index];
      const nextChild = this.visit(prevChild, nextState);
      if (nextChild !== prevChild) {
        nextChildren = nextChildren || children.slice(0, index);
      }
      if (nextChildren && nextChild) {
        nextChildren.push(nextChild);
      }
    }, this);
    if (nextChildren) {
      if (!nextChildren.length) {
        return null;
      }
      return node.clone(nextChildren);
    }
    return node;
  }
}

module.exports = RelayQueryTransform;
