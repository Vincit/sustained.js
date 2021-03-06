import { QueryNode, SelectNode, FunctionNode } from '../nodes'
import { JoinOperationBuilder } from './JoinOperationBuilder'
import { OperationBuilder } from './OperationBuilder'
import { FilterNode, Bool } from '../nodes/FilterNode'
import { FilterGroupNode } from '../nodes/FilterGroupNode'
import { QueryType } from '../nodes/QueryNode'
import { raw } from './RawOperationBuilder'

import { parseFrom } from '../parsers/parseFrom'
import { parseWith } from '../parsers/parseWith'
import { parseJoin } from '../parsers/parseJoin'
import { parseValue } from '../parsers/parseValue'
import { parseWhere } from '../parsers/parseWhere'
import { parseSelect } from '../parsers/parseSelect'
import { parseHaving } from '../parsers/parseHaving'
import { parseInsert } from '../parsers/parseInsert'
import { parseUpdate } from '../parsers/parseUpdate'
import { parseOrderBy } from '../parsers/parseOrderBy'
import { parseGroupBy } from '../parsers/parseGroupBy'
import { parseReturning } from '../parsers/parseReturning'
import { parseIdentifier } from '../parsers/parseIdentifier'

export class QueryOperationBuilder extends OperationBuilder {
  constructor({ operationNode } = {}) {
    super(operationNode || new QueryNode());
  }

  static get JoinBuilder() {
    return JoinOperationBuilder;
  }

  get and() {
    return this;
  }

  get or() {
    // Add a hook to be called for the next batch of operation nodes that
    // are added.
    forNextAddedNodes(this, [FilterNode, FilterGroupNode], node => {
      node.bool = Bool.Or;
    });

    return this;
  }

  get not() {
    // Add a hook to be called for the next batch of operation nodes that
    // are added.
    forNextAddedNodes(this, [FilterNode, FilterGroupNode], node => {
      node.not = true;
    });

    return this;
  }

  clone() {
    return new this.constructor({
      operationNode: this.operationNode.clone()
    });
  }

  select(...args) {
    return this.addNodes(
      this.operationNode.select,

      parseSelect(args, {
        queryBuilderClass: this.constructor,
        subQueryBuilderClass: this.constructor
      })
    );
  }

  from(...args) {
    const { nodes, options } = parseFrom(args);

    // knex quirk: from overrides previous calls.
    this.operationNode.from = [];
    this.operationNode.fromOptions = Object.assign(this.operationNode.fromOptions, options);

    return this.addNodes(this.operationNode.from, nodes);
  }

  into(...args) {
    return this.from(...args);
  }

  table(...args) {
    return this.from(...args);
  }

  insert(...args) {
    this.operationNode.queryType = QueryType.Insert;

    this.operationNode.insert = this.runHooks(
      parseInsert(args, {
        queryBuilderClass: this.constructor,
        subQueryBuilderClass: this.constructor
      })
    );

    if (args[1]) {
      this.returning(args[1]);
    }

    return this;
  }

  update(...args) {
    this.operationNode.queryType = QueryType.Update;

    this.operationNode.update = this.runHooks(
      parseUpdate(args, {
        queryBuilderClass: this.constructor,
        subQueryBuilderClass: this.constructor
      })
    );

    return this;
  }

  delete(...args) {
    this.operationNode.queryType = QueryType.Delete;
    return this;
  }

  del(...args) {
    return this.delete(...args);
  }

  where(...args) {
    return this.addNodes(
      this.operationNode.where,

      parseWhere(args, {
        bool: Bool.And,
        not: false,
        queryBuilderClass: this.constructor,
        subQueryBuilderClass: this.constructor
      })
    );
  }

  andWhere(...args) {
    return this.where(...args);
  }

  whereRaw(...args) {
    return this.where(raw(...args));
  }

  andWhereRaw(...args) {
    return this.andWhere(raw(...args));
  }

  orWhereRaw(...args) {
    return this.orWhere(raw(...args));
  }

  whereNot(...args) {
    return this.addNodes(
      this.operationNode.where,

      parseWhere(args, {
        bool: Bool.And,
        not: true,
        queryBuilderClass: this.constructor,
        subQueryBuilderClass: this.constructor
      })
    );
  }

  andWhereNot(...args) {
    return this.whereNot(...args);
  }

  orWhere(...args) {
    return this.addNodes(
      this.operationNode.where,

      parseWhere(args, {
        bool: Bool.Or,
        not: false,
        queryBuilderClass: this.constructor,
        subQueryBuilderClass: this.constructor
      })
    );
  }

  orWhereNot(...args) {
    return this.addNodes(
      this.operationNode.where,

      parseWhere(args, {
        bool: Bool.Or,
        not: true,
        queryBuilderClass: this.constructor,
        subQueryBuilderClass: this.constructor
      })
    );
  }

  whereIn(lhs, rhs) {
    return this.where(lhs, 'in', rhs);
  }

  andWhereIn(...args) {
    return this.whereIn(...args);
  }

  orWhereIn(lhs, rhs) {
    return this.orWhere(lhs, 'in', rhs);
  }

  whereNotIn(lhs, rhs) {
    return this.whereNot(lhs, 'in', rhs);
  }

  andWhereNotIn(...args) {
    return this.whereNotIn(...args);
  }

  orWhereNotIn(lhs, rhs) {
    return this.orWhereNot(lhs, 'in', rhs);
  }

  whereBetween(lhs, rhs) {
    return this.where(lhs, 'between', rhs);
  }

  andWhereBetween(...args) {
    return this.whereBetween(...args);
  }

  orWhereBetween(lhs, rhs) {
    return this.orWhere(lhs, 'between', rhs);
  }

  whereNotBetween(lhs, rhs) {
    return this.whereNot(lhs, 'between', rhs);
  }

  andWhereNotBetween(...args) {
    return this.whereNotBetween(...args);
  }

  orWhereNotBetween(lhs, rhs) {
    return this.orWhereNot(lhs, 'between', rhs);
  }

  whereExists(arg) {
    return this.where(null, 'exists', arg);
  }

  andWhereExists(...args) {
    return this.whereExists(...args);
  }

  orWhereExists(arg) {
    return this.orWhere(null, 'exists', arg);
  }

  whereNotExists(arg) {
    return this.whereNot(null, 'exists', arg);
  }

  andWhereNotExists(...args) {
    return this.whereNotExists(...args);
  }

  orWhereNotExists(arg) {
    return this.orWhereNot(null, 'exists', arg);
  }

  whereNull(arg) {
    return this.where(arg, 'is', null);
  }

  andWhereNull(...args) {
    return this.whereNull(...args);
  }

  whereNotNull(arg) {
    return this.whereNot(arg, 'is', null);
  }

  andWhereNotNull(...args) {
    return this.whereNotNull(...args);
  }

  orWhereNull(arg) {
    return this.orWhere(arg, 'is', null);
  }

  orWhereNotNull(arg) {
    return this.orWhereNot(arg, 'is', null);
  }

  having(...args) {
    return this.addNodes(
      this.operationNode.having,

      parseHaving(args, {
        bool: Bool.And,
        not: false,
        queryBuilderClass: this.constructor,
        subQueryBuilderClass: this.constructor
      })
    );
  }

  andHaving(...args) {
    return this.having(...args);
  }

  havingRaw(...args) {
    return this.having(raw(...args));
  }

  andHavingRaw(...args) {
    return this.andHaving(raw(...args));
  }

  orHavingRaw(...args) {
    return this.orHaving(raw(...args));
  }

  havingNot(...args) {
    return this.addNodes(
      this.operationNode.having,

      parseHaving(args, {
        bool: Bool.And,
        not: true,
        queryBuilderClass: this.constructor,
        subQueryBuilderClass: this.constructor
      })
    );
  }

  andHavingNot(...args) {
    return this.havingNot(...args);
  }

  orHaving(...args) {
    return this.addNodes(
      this.operationNode.having,

      parseHaving(args, {
        bool: Bool.Or,
        not: false,
        queryBuilderClass: this.constructor,
        subQueryBuilderClass: this.constructor
      })
    );
  }

  orHavingNot(...args) {
    return this.addNodes(
      this.operationNode.having,

      parseHaving(args, {
        bool: Bool.Or,
        not: true,
        queryBuilderClass: this.constructor,
        subQueryBuilderClass: this.constructor
      })
    );
  }

  havingIn(lhs, rhs) {
    return this.having(lhs, 'in', rhs);
  }

  andHavingIn(...args) {
    return this.havingIn(...args);
  }

  orHavingIn(lhs, rhs) {
    return this.orHaving(lhs, 'in', rhs);
  }

  havingNotIn(lhs, rhs) {
    return this.havingNot(lhs, 'in', rhs);
  }

  andHavingNotIn(...args) {
    return this.havingNotIn(...args);
  }

  orHavingNotIn(lhs, rhs) {
    return this.orHavingNot(lhs, 'in', rhs);
  }

  havingBetween(lhs, rhs) {
    return this.having(lhs, 'between', rhs);
  }

  andHavingBetween(...args) {
    return this.havingBetween(...args);
  }

  orHavingBetween(lhs, rhs) {
    return this.orHaving(lhs, 'between', rhs);
  }

  havingNotBetween(lhs, rhs) {
    return this.havingNot(lhs, 'between', rhs);
  }

  andHavingNotBetween(...args) {
    return this.havingNotBetween(...args);
  }

  orHavingNotBetween(lhs, rhs) {
    return this.orHavingNot(lhs, 'between', rhs);
  }

  havingExists(arg) {
    return this.having(null, 'exists', arg);
  }

  andHavingExists(...args) {
    return this.havingExists(...args);
  }

  orHavingExists(arg) {
    return this.orHaving(null, 'exists', arg);
  }

  havingNotExists(arg) {
    return this.havingNot(null, 'exists', arg);
  }

  andHavingNotExists(...args) {
    return this.havingNotExists(...args);
  }

  orHavingNotExists(arg) {
    return this.orHavingNot(null, 'exists', arg);
  }

  havingNull(arg) {
    return this.having(arg, 'is', null);
  }

  andHavingNull(...args) {
    return this.havingNull(...args);
  }

  havingNotNull(arg) {
    return this.havingNot(arg, 'is', null);
  }

  andHavingNotNull(...args) {
    return this.havingNotNull(...args);
  }

  orHavingNull(arg) {
    return this.orHaving(arg, 'is', null);
  }

  orHavingNotNull(arg) {
    return this.orHavingNot(arg, 'is', null);
  }

  specificJoin(joinType, args) {
    return this.addNodes(
      this.operationNode.join,

      parseJoin(args, {
        joinType,
        queryBuilderClass: this.constructor,
        subQueryBuilderClass: this.constructor
      })
    );
  }

  join(...args) {
    return this.specificJoin('inner', args);
  }

  crossJoin(...args) {
    return this.specificJoin('cross', args);
  }

  innerJoin(...args) {
    return this.specificJoin('inner', args);
  }

  leftJoin(...args) {
    return this.specificJoin('left', args);
  }

  leftOuterJoin(...args) {
    return this.specificJoin('left outer', args);
  }

  rightJoin(...args) {
    return this.specificJoin('right', args);
  }

  rightOuterJoin(...args) {
    return this.specificJoin('right outer', args);
  }

  outerJoin(...args) {
    return this.specificJoin('outer', args);
  }

  fullOuterJoin(...args) {
    return this.specificJoin('full outer', args);
  }

  joinRaw(...args) {
    return this.join(raw(...args));
  }

  as(alias) {
    this.operationNode.alias = this.runHooks(parseIdentifier(alias));
    return this;
  }

  withSchema(schema) {
    this.operationNode.schema = this.runHooks(parseIdentifier(schema));
    return this;
  }

  distinct(...args) {
    this.operationNode.selectOptions.distinct = true;

    this.addNodes(
      this.operationNode.select,

      parseSelect(args, {
        queryBuilderClass: this.constructor,
        subQueryBuilderClass: this.constructor
      })
    );
    return this;
  }

  limit(limit) {
    // knex quirk: do nothing with null.
    if (limit === null) {
      return this;
    }

    this.operationNode.limit = this.runHooks(
      parseValue(limit, {
        queryBuilderClass: this.constructor,
        subQueryBuilderClass: this.constructor
      })
    );

    return this;
  }

  offset(offset) {
    // knex quirk: do nothing with null.
    if (offset === null) {
      return this;
    }

    this.operationNode.offset = this.runHooks(
      parseValue(offset, {
        queryBuilderClass: this.constructor,
        subQueryBuilderClass: this.constructor
      })
    );

    return this;
  }

  first(...args) {
    // knex quirk: WTF
    if (args.length) {
      this.select(...args);
    }

    return this.limit(1);
  }

  union(...args) {
    return this;
  }

  unionAll(...args) {
    return this;
  }

  // Call normal select, but wrap all selections into a function.
  selectFunction(funcName, funcModifier, args) {
    const nodes = parseSelect(args, {
      queryBuilderClass: this.constructor,
      subQueryBuilderClass: this.constructor
    });

    nodes.forEach(node => {
      if (node instanceof SelectNode) {
        node.node = new FunctionNode(funcName, [funcModifier], [node.node]);
      }
    });

    return this.addNodes(this.operationNode.select, nodes);
  }

  min(...args) {
    return this.selectFunction('min', null, args);
  }

  max(...args) {
    return this.selectFunction('max', null, args);
  }

  count(...args) {
    // knex quirk: no arguments for count --> count(*)
    if (args.length === 0) {
      args = ['*'];
    }

    return this.selectFunction('count', null, args);
  }

  countDistinct(...args) {
    // knex quirk: no arguments for count --> count(*)
    if (args.length === 0) {
      args = ['*'];
    }

    return this.selectFunction('count', 'distinct', args);
  }

  sum(...args) {
    return this.selectFunction('sum', null, args);
  }

  sumDistinct(...args) {
    return this.selectFunction('sum', 'distinct', args);
  }

  avg(...args) {
    return this.selectFunction('avg', null, args);
  }

  avgDistinct(...args) {
    return this.selectFunction('avg', 'distinct', args);
  }

  groupBy(...args) {
    return this.addNodes(
      this.operationNode.groupBy,

      parseGroupBy(args, {
        queryBuilderClass: this.constructor,
        subQueryBuilderClass: this.constructor
      })
    );
  }

  groupByRaw(...args) {
    return this.groupBy(raw(...args));
  }

  orderBy(...args) {
    return this.addNodes(
      this.operationNode.orderBy,

      parseOrderBy(args, {
        queryBuilderClass: this.constructor,
        subQueryBuilderClass: this.constructor
      })
    );
  }

  orderByRaw(...args) {
    return this.addNodes(
      this.operationNode.orderBy,

      parseOrderBy([raw(...args)], {
        ignoreDirection: true,
        queryBuilderClass: this.constructor,
        subQueryBuilderClass: this.constructor
      })
    );
  }

  returning(...args) {
    return this.addNodes(
      this.operationNode.returning,

      parseReturning(args, {
        queryBuilderClass: this.constructor,
        subQueryBuilderClass: this.constructor
      })
    );
  }

  with(...args) {
    return this.addNodes(
      this.operationNode.with,

      parseWith(args, {
        queryBuilderClass: this.constructor,
        subQueryBuilderClass: this.constructor
      })
    );
  }

  clearSelect() {
    this.operationNode.select = [];
    return this;
  }

  clearWhere() {
    this.operationNode.where = [];
    return this;
  }

  truncate() {
    return this;
  }

  forUpdate() {
    return this;
  }

  modify(...args) {
    args[0].call(this, this, ...args.slice(1));
    return this;
  }

  fromJS(obj) {
    Object.keys(obj).forEach(key => {
      const value = obj[key];

      if (Array.isArray(value)) {
        this[key].apply(this, value);
      } else {
        this[key].call(this, value);
      }
    });

    return this;
  }
}

function forNextAddedNodes(builder, nodeClasses, hook) {
  const onceHook = nodes => {
    nodes.forEach(node => {
      if (nodeClasses.some(nodeClass => node instanceof nodeClass)) {
        hook(node);
      }
    });

    // Remove this function from the hook list as soon as it has been called.
    builder.operationNodeAddHooks = builder.operationNodeAddHooks.filter(it => it !== onceHook);
  };

  builder.operationNodeAddHooks.push(onceHook);
}
