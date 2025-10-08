import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
  } from 'typeorm';
  
  export type UserRole = 'CUSTOMER' | 'AIRLINE_ADMIN' | 'AIRLINE_STAFF';
  
  @Entity('users')
  export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column('text')
    email: string;
  
    @Column('text', { nullable: true })
    passwordHash: string | null;
  
    @Column('text', { name: 'full_name' })
    fullName: string;

    @Column('text', { name: 'avatar_url' })
    avatarUrl: string;
  
    @Column('text', { nullable: true })
    phone: string | null;
  
    @Column('text', { default: 'CUSTOMER' })
    role: UserRole;
  
    @CreateDateColumn({
      type: 'timestamp with time zone',
      name: 'created_at',
      default: () => 'now()',
    })
    createdAt: Date;
  
    @UpdateDateColumn({
      type: 'timestamp with time zone',
      name: 'updated_at',
      default: () => 'now()',
    })
    updatedAt: Date;
  }
  