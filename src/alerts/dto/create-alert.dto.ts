import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsNumber,
  Min,
  IsOptional,
  IsEmail,
  IsUrl,
  IsInt,
} from 'class-validator';

export class CreateAlertDto {
  @IsString()
  @IsNotEmpty()
  origin: string;

  @IsString()
  @IsNotEmpty()
  destination: string;

  @IsDateString()
  departDate: string;

  @IsInt()
  @Min(1)
  passengers: number = 1;

  @IsNumber()
  @Min(0)
  targetPrice: number;

  @IsString()
  @IsOptional()
  currency?: string = 'USD';

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsUrl()
  @IsOptional()
  webhook?: string;
}
