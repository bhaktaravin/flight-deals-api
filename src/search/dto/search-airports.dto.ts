import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class SearchAirportsDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  query: string;
}
