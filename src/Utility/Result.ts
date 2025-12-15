type ResultMatch<T, E, U> = {
    ok: (value: T) => U;
    err: (error: E) => U;
};

export class Result<T, E> {
    private constructor(
        private readonly _ok: boolean,
        private readonly _value: T | undefined,
        private readonly _error: E | undefined
    ) { }

    static ok<T, E = never>(value: T): Result<T, E> {
        return new Result<T, E>(true, value, undefined);
    }

    static err<E, T = never>(error: E): Result<T, E> {
        return new Result<T, E>(false, undefined, error);
    }

    isOk(): this is Result<T, never> {
        return this._ok;
    }

    isErr(): this is Result<never, E> {
        return !this._ok;
    }

    ok(): T | undefined {
        return this._value;
    }

    err(): E | undefined {
        return this._error;
    }

    unwrap(): T {
        if (this._ok) return this._value as T;
        throw new Error(`Called unwrap on Err: ${this._error}`);
    }

    unwrapErr(): E {
        if (!this._ok) return this._error as E;
        throw new Error(`Called unwrapErr on Ok: ${this._value}`);
    }

    unwrapOr(defaultValue: T): T {
        return this._ok ? (this._value as T) : defaultValue;
    }

    unwrapOrElse(fn: (error: E) => T): T {
        return this._ok ? (this._value as T) : fn(this._error as E);
    }

    expect(msg: string): T {
        if (this._ok) return this._value as T;
        throw new Error(`${msg}: ${this._error}`);
    }

    expectErr(msg: string): E {
        if (!this._ok) return this._error as E;
        throw new Error(`${msg}: ${this._value}`);
    }

    map<U>(fn: (value: T) => U): Result<U, E> {
        return this._ok
            ? Result.ok(fn(this._value as T))
            : Result.err(this._error as E);
    }

    mapErr<F>(fn: (error: E) => F): Result<T, F> {
        return this._ok
            ? Result.ok(this._value as T)
            : Result.err(fn(this._error as E));
    }

    mapOr<U>(defaultValue: U, fn: (value: T) => U): U {
        return this._ok ? fn(this._value as T) : defaultValue;
    }

    mapOrElse<U>(errFn: (error: E) => U, okFn: (value: T) => U): U {
        return this._ok ? okFn(this._value as T) : errFn(this._error as E);
    }

    andThen<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
        return this._ok ? fn(this._value as T) : Result.err(this._error as E);
    }

    orElse<F>(fn: (error: E) => Result<T, F>): Result<T, F> {
        return this._ok ? Result.ok(this._value as T) : fn(this._error as E);
    }

    and<U>(other: Result<U, E>): Result<U, E> {
        return this._ok ? other : Result.err(this._error as E);
    }

    or<F>(other: Result<T, F>): Result<T, F> {
        return this._ok ? Result.ok(this._value as T) : other;
    }

    match<U>(matcher: ResultMatch<T, E, U>): U {
        return this._ok
            ? matcher.ok(this._value as T)
            : matcher.err(this._error as E);
    }

    static async fromPromise<T, E = Error>(
        promise: Promise<T>,
        mapErr: (e: unknown) => E = (e) => e as E
    ): Promise<Result<T, E>> {
        try {
            return Result.ok(await promise);
        } catch (e) {
            return Result.err(mapErr(e));
        }
    }

    static try<T, E = Error>(
        fn: () => T,
        mapErr: (e: unknown) => E = (e) => e as E
    ): Result<T, E> {
        try {
            return Result.ok(fn());
        } catch (e) {
            return Result.err(mapErr(e));
        }
    }
}

export const Ok = Result.ok;
export const Err = Result.err;
