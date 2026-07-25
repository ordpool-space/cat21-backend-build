import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class Cat21SessionGuard implements CanActivate {
    private readonly logger;
    canActivate(context: ExecutionContext): boolean;
}
export declare const Cat21SessionAddress: (...dataOrPipes: unknown[]) => ParameterDecorator;
