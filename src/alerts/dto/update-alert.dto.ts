import { IsEnum, IsOptional, IsNumber, Min, IsEmail, IsUrl } from 'class-validator';

export enum AlertStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  EXPIRED = 'EXPIRED',
  TRIGGERED = 'TRIGGERED',
}

export class UpdateAlertDto {
  @IsEnum(AlertStatus)
  @IsOptional()
  status?: AlertStatus;

  @IsNumber()
  @Min(0)
  @IsOptional()
  targetPrice?: number;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsUrl()
  @IsOptional()
  webhook?: string;
}
