import { Injectable,NotFoundException } from '@nestjs/common';
import { CreateAirlineDto } from './dto/create-airline.dto';
import { UpdateAirlineDto } from './dto/update-airline.dto';
import { SupabaseService } from '../../services/supabase/supabase.service';


@Injectable()
export class AirlineService {
  constructor(private readonly supabaseService: SupabaseService) {
  }
  async create(createAirlineDto: CreateAirlineDto) {
    const {data,error}= await this.supabaseService.supabaseClient
      .from('airlines')
      .insert(createAirlineDto).
      select().
      single()
    if(error){
      throw new Error(error.message);
    }
    return data;
  }

  async findAll() {
    const { data, error } = await this.supabaseService.supabaseClient
      .from('airlines')
      .select('*');
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  async findOne(id: string) {
    const { data, error } = await this.supabaseService.supabaseClient
      .from('airlines')
      .select('*')
      .eq('id', id) //so sanh bằng hai id
      .single(); //lấy một bản ghi
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  async update(id: string, updateAirlineDto: UpdateAirlineDto) {
   const { data, error } =await this.supabaseService.supabaseClient
      .from('airlines')
      .update(updateAirlineDto)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      throw new Error(error.message);
      console.log(updateAirlineDto.iata_code);
    }
    return data;
  }

  async remove(id: string) {
    const { data, error } = await this.supabaseService.supabaseClient
      .from('airlines')
      .delete()
      .eq('id', id)
      .select()
      .single();
    if (error) {
      if(error.code==='PGRST116'){
        throw new NotFoundException('Không tìm thấy hãng bay');
      }
      else
        throw new Error(error.message);
    }
    return data;
  }
}
