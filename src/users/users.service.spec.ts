import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from 'src/jwt/jwt.service';
import { MailService } from 'src/mail/mail.service';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Verification } from './entities/verification.entity';
import { UsersService } from './users.service';

const mockRepository = () => ({
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
});

const mockJwtService = {
  sign: jest.fn(),
  verify: jest.fn(),
};

const mockMailService = {
  sendVerificationEmail: jest.fn(),
};

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('UserService', () => {
  let service: UsersService; // create service outside of beforeAll to use later
  let usersRepository: MockRepository<User>;
  let verificationRepository: MockRepository<Verification>;
  let mailService: MailService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      // create isolated module only
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User), // To do isolated 'unit test' do mock
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(Verification),
          useValue: mockRepository(),
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
      ],
    }).compile();
    service = module.get<UsersService>(UsersService);
    usersRepository = module.get(getRepositoryToken(User));
    verificationRepository = module.get(getRepositoryToken(Verification));
    mailService = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAccount', () => {
    const createAccountArgs = {
      email: '',
      password: '',
      role: 0,
    };
    it('should fail if user exists', async () => {
      usersRepository.findOne.mockResolvedValue({
        id: 1,
        email: '',
      });
      const result = await service.createAccount(createAccountArgs); // whatever created account it is, if email already exists, get error
      expect(result).toMatchObject({
        ok: false,
        error: 'There is a user with that email already',
      });
    });
    it('should create a new user', async () => {
      usersRepository.findOne.mockResolvedValue(undefined);
      usersRepository.create.mockReturnValue(createAccountArgs);
      usersRepository.save.mockResolvedValue(createAccountArgs);
      verificationRepository.create.mockReturnValue({
        user: createAccountArgs,
      });
      verificationRepository.save.mockResolvedValue({ code: 'code' });
      const result = await service.createAccount(createAccountArgs);
      expect(usersRepository.create).toHaveBeenCalledTimes(1);
      expect(usersRepository.create).toHaveBeenCalledWith(createAccountArgs);
      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith(createAccountArgs);
      expect(verificationRepository.create).toHaveBeenCalledTimes(1);
      expect(verificationRepository.create).toHaveBeenCalledWith({
        user: createAccountArgs,
      });
      expect(verificationRepository.save).toHaveBeenCalledTimes(1);
      expect(verificationRepository.save).toHaveBeenCalledWith({
        user: createAccountArgs,
      });
      expect(mailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
      );
      expect(result).toEqual({ ok: true });
    });
  });

  it.todo('login');
  it.todo('findById');
  it.todo('editProfile');
  it.todo('verifyEmail');
});