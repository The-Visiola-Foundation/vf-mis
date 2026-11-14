import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AccessTokenGuard } from './access-token.guard';
import { UserRole } from '../../common/user-role.enum';

describe('AccessTokenGuard', () => {
  let guard: AccessTokenGuard;
  let reflector: Reflector;
  let jwt: JwtService;
  let config: ConfigService;

  beforeEach(() => {
    reflector = new Reflector();
    jwt = {
      verifyAsync: jest.fn(),
    } as unknown as JwtService;
    config = {
      getOrThrow: jest.fn().mockReturnValue('test-secret'),
    } as unknown as ConfigService;
    guard = new AccessTokenGuard(jwt, config, reflector);
  });

  it('requires a bearer token even for GET requests on protected routes', async () => {
    const request = {
      method: 'GET',
      headers: {},
    } as any;

    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => ({}),
      getClass: () => class TestController {},
    } as any;

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('allows public routes without a token', async () => {
    const request = {
      method: 'GET',
      headers: {},
    } as any;

    const publicReflector = {
      getAllAndOverride: jest.fn().mockReturnValue(true),
    } as unknown as Reflector;

    const publicGuard = new AccessTokenGuard(jwt, config, publicReflector);
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => ({}),
      getClass: () => class TestController {},
    } as any;

    await expect(publicGuard.canActivate(context)).resolves.toBe(true);
  });

  it('attaches the user payload from the verified JWT', async () => {
    const payload = { sub: 'user-1', email: 'user@example.com', role: UserRole.ADMIN };
    jest.spyOn(jwt, 'verifyAsync').mockResolvedValue(payload);

    const request = {
      method: 'POST',
      headers: { authorization: 'Bearer token.123' },
    } as any;

    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => ({}),
      getClass: () => class TestController {},
    } as any;

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual(payload);
  });
});
