type ResultMatch<T, E, U, _E> = {
    Ok: (value: T) => U;
    Err: (error: E) => _E;
};

export class Result<T, E> {
    private constructor(
        private readonly _ok: boolean,
        private readonly _value: T | undefined,
        private readonly _error: E | undefined
    ) {}

    static Ok<T, E = never>(value: T): Result<T, E> {
        return new Result<T, E>(true, value, undefined);
    }

    static Err<E, T = never>(error: E): Result<T, E> {
        return new Result<T, E>(false, undefined, error);
    }

    IsOk(): this is Result<T, never> {
        return this._ok;
    }

    IsErr(): this is Result<never, E> {
        return !this._ok;
    }

    Ok(): T | undefined {
        return this._value;
    }

    Err(): E | undefined {
        return this._error;
    }

    Unwrap(): T {
        if (this._ok) return this._value as T;
        throw new Error(`Called Unwrap on Err: ${this._error}`);
    }

    UnwrapErr(): E {
        if (!this._ok) return this._error as E;
        throw new Error(`Called UnwrapErr on Ok: ${this._value}`);
    }

    UnwrapOr(defaultValue: T): T {
        return this._ok ? (this._value as T) : defaultValue;
    }

    UnwrapOrElse(fn: (error: E) => T): T {
        return this._ok ? (this._value as T) : fn(this._error as E);
    }

    Expect(msg: string): T {
        if (this._ok) return this._value as T;
        throw new Error(`${msg}: ${this._error}`);
    }

    ExpectErr(msg: string): E {
        if (!this._ok) return this._error as E;
        throw new Error(`${msg}: ${this._value}`);
    }

    Map<U>(fn: (value: T) => U): Result<U, E> {
        return this._ok
            ? Result.Ok(fn(this._value as T))
            : Result.Err(this._error as E);
    }

    MapErr<F>(fn: (error: E) => F): Result<T, F> {
        return this._ok
            ? Result.Ok(this._value as T)
            : Result.Err(fn(this._error as E));
    }

    MapOr<U>(defaultValue: U, fn: (value: T) => U): U {
        return this._ok ? fn(this._value as T) : defaultValue;
    }

    MapOrElse<U>(errFn: (error: E) => U, okFn: (value: T) => U): U {
        return this._ok
            ? okFn(this._value as T)
            : errFn(this._error as E);
    }

    AndThen<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
        return this._ok
            ? fn(this._value as T)
            : Result.Err(this._error as E);
    }

    OrElse<F>(fn: (error: E) => Result<T, F>): Result<T, F> {
        return this._ok
            ? Result.Ok(this._value as T)
            : fn(this._error as E);
    }

    And<U>(other: Result<U, E>): Result<U, E> {
        return this._ok
            ? other
            : Result.Err(this._error as E);
    }

    Or<F>(other: Result<T, F>): Result<T, F> {
        return this._ok
            ? Result.Ok(this._value as T)
            : other;
    }

    Match<U, _E>(matcher: ResultMatch<T, E, U, _E>): U | _E {
        return this._ok
            ? matcher.Ok(this._value as T) as U
            : matcher.Err(this._error as E) as _E;
    }

    static async FromPromise<T, E = Error>(
        promise: Promise<T>,
        mapErr: (e: unknown) => E = (e) => e as E
    ): Promise<Result<T, E>> {
        try {
            return Result.Ok(await promise);
        } catch (e) {
            return Result.Err(mapErr(e));
        }
    }

    static Try<T, E = Error>(
        fn: () => T,
        mapErr: (e: unknown) => E = (e) => e as E
    ): Result<T, E> {
        try {
            return Result.Ok(fn());
        } catch (e) {
            return Result.Err(mapErr(e));
        }
    }
}
