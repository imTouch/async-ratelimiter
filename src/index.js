'use strict'

const assert = require('assert')

const microtime = require('./microtime')

module.exports = class Limiter {
  constructor ({ id, db, max = 2500, duration = 3600000, namespace = 'limit' }) {
    assert(db, 'db required')
    this.db = db
    this.id = id
    this.max = max
    this.duration = duration
    this.namespace = namespace
    // this.getKey = this.getKey.bind(this)
  }

  getKey (id) {
    return `${this.namespace}:${id}`
  }

  async get ({ id = this.id, max = this.max, duration = this.duration } = {}) {
    assert(id, 'id required')
    assert(max, 'max required')
    assert(duration, 'duration required')

    const { db } = this
    const key = this.getKey(id)
    const now = microtime.now()
    const start = now - duration * 1000

    const res = await db
      .multi()
      .zremrangebyscore([key, 0, start])
      .zcard([key])
      .zadd([key, now, now])
      .zrange([key, 0, 0])
      .zrange([key, -max, -max])
      .zremrangebyrank([key, 0, -(max + 1)])
      .pexpire([key, duration])
      .exec()

    const count = parseInt(res[1][1])
    const oldest = parseInt(res[3][1])
    const oldestInRange = parseInt(res[4][1])
    const resetMicro = (Number.isNaN(oldestInRange) ? oldest : oldestInRange) + duration * 1000

    return {
      remaining: count < max ? max - count : 0,
      reset: Math.floor(resetMicro / 1000000),
      total: max
    }
  }

  async try ({ id = this.id, max = this.max, duration = this.duration } = {}) {
    assert(id, 'id required')
    assert(max, 'max required')
    assert(duration, 'duration required')

    const { db } = this
    const key = this.getKey(id)
    const now = microtime.now()
    const start = now - duration * 1000

    const res = await db
      .multi()
      .zremrangebyscore([key, 0, start])
      .zcard([key])
      .zrange([key, 0, 0])
      .zrange([key, -max, -max])
      .zremrangebyrank([key, 0, -(max + 1)])
      .exec()

    const count = parseInt(res[1][1])
    const oldest = parseInt(res[2][1])
    const oldestInRange = parseInt(res[3][1])
    const resetMicro = (Number.isNaN(oldestInRange) ? oldest : oldestInRange) + duration * 1000

    return {
      remaining: count < max ? max - count : 0,
      reset: Math.floor(resetMicro / 1000000),
      total: max
    }
  }

  async zremrangeToday ({ id = this.id, max = this.max, duration = this.duration } = {}) {
    assert(id, 'id required')
    assert(max, 'max required')
    assert(duration, 'duration required')

    const { db } = this
    const key = this.getKey(id)
    const now = microtime.now()
    const today = microtime.today()
    const start = now - duration * 1000

    const res = await db
      .multi()
      .zremrangebyscore([key, 0, today])
      .zremrangebyscore([key, 0, start])
      .zcard([key])
      .zadd([key, now, now])
      .zrange([key, 0, 0])
      .zrange([key, -max, -max])
      .zremrangebyrank([key, 0, -(max + 1)])
      .zcard([key])
      .pexpire([key, duration])
      .exec()

    const count = parseInt(res[2][1])
    const oldest = parseInt(res[4][1])
    const oldestInRange = parseInt(res[5][1])
    const resetMicro = (Number.isNaN(oldestInRange) ? oldest : oldestInRange) + duration * 1000

    return {
      remaining: count < max ? max - count : 0,
      reset: Math.floor(resetMicro / 1000000),
      total: max
    }
  }
}
