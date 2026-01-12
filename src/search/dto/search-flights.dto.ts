import { IsDateString, IsNotEmpty, IsOptional, IsString, IsInt, Min } from 'class-validator';

export class SearchFlightsDto {
  @IsString()
  @IsNotEmpty()
  origin: string;

  @IsString()
  @IsNotEmpty()
  destination: string;

  @IsDateString()
  departDate: string;

  @IsOptional()
  @IsDateString()
  returnDate?: string;

  @IsInt()
  @Min(1)
  passengers: number;
}
