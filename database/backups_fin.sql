--
-- PostgreSQL database dump
--

\restrict dpNls966MwgKEsGaitYs0g2k50CWsT96Webj6gdMu6vj6zsBBebmw0SQlWIrBgx

-- Dumped from database version 17.7
-- Dumped by pg_dump version 18.1

-- Started on 2025-12-30 00:43:24

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 5 (class 2615 OID 17904)
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 220 (class 1259 OID 17919)
-- Name: accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accounts (
    id integer NOT NULL,
    user_id integer,
    name character varying(255) NOT NULL,
    type character varying(50) NOT NULL,
    balance numeric(15,2) DEFAULT 0,
    currency character varying(10) DEFAULT 'IDR'::character varying,
    icon character varying(50),
    color character varying(50),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 219 (class 1259 OID 17918)
-- Name: accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4663 (class 0 OID 0)
-- Dependencies: 219
-- Name: accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.accounts_id_seq OWNED BY public.accounts.id;


--
-- TOC entry 236 (class 1259 OID 18085)
-- Name: assets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assets (
    id integer NOT NULL,
    user_id integer,
    name character varying(255) NOT NULL,
    asset_type character varying(50) NOT NULL,
    purchase_date date,
    purchase_price numeric(15,2),
    current_value numeric(15,2),
    depreciation_rate numeric(5,2),
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 235 (class 1259 OID 18084)
-- Name: assets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.assets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4664 (class 0 OID 0)
-- Dependencies: 235
-- Name: assets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.assets_id_seq OWNED BY public.assets.id;


--
-- TOC entry 228 (class 1259 OID 18008)
-- Name: budgets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.budgets (
    id integer NOT NULL,
    user_id integer,
    category_id integer,
    amount numeric(15,2) NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    rollover boolean DEFAULT false,
    alert_threshold numeric(5,2) DEFAULT 80,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 227 (class 1259 OID 18007)
-- Name: budgets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.budgets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4665 (class 0 OID 0)
-- Dependencies: 227
-- Name: budgets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.budgets_id_seq OWNED BY public.budgets.id;


--
-- TOC entry 222 (class 1259 OID 17936)
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    user_id integer,
    name character varying(255) NOT NULL,
    type character varying(20) NOT NULL,
    parent_id integer,
    icon character varying(50),
    color character varying(50),
    budget_type character varying(20),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 221 (class 1259 OID 17935)
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4666 (class 0 OID 0)
-- Dependencies: 221
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- TOC entry 242 (class 1259 OID 18131)
-- Name: credit_cards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.credit_cards (
    id integer NOT NULL,
    user_id integer,
    account_id integer,
    card_name character varying(255) NOT NULL,
    bank character varying(100),
    credit_limit numeric(15,2) NOT NULL,
    current_balance numeric(15,2) DEFAULT 0,
    statement_date integer,
    due_date integer,
    interest_rate numeric(5,2),
    rewards_program character varying(100),
    points_earned numeric(15,2) DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 241 (class 1259 OID 18130)
-- Name: credit_cards_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.credit_cards_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4667 (class 0 OID 0)
-- Dependencies: 241
-- Name: credit_cards_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.credit_cards_id_seq OWNED BY public.credit_cards.id;


--
-- TOC entry 240 (class 1259 OID 18116)
-- Name: debt_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.debt_payments (
    id integer NOT NULL,
    debt_id integer,
    amount numeric(15,2) NOT NULL,
    payment_date date NOT NULL,
    principal_amount numeric(15,2),
    interest_amount numeric(15,2),
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 239 (class 1259 OID 18115)
-- Name: debt_payments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.debt_payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4668 (class 0 OID 0)
-- Dependencies: 239
-- Name: debt_payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.debt_payments_id_seq OWNED BY public.debt_payments.id;


--
-- TOC entry 238 (class 1259 OID 18101)
-- Name: debts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.debts (
    id integer NOT NULL,
    user_id integer,
    debt_type character varying(50) NOT NULL,
    creditor character varying(255) NOT NULL,
    original_amount numeric(15,2) NOT NULL,
    current_balance numeric(15,2) NOT NULL,
    interest_rate numeric(5,2),
    minimum_payment numeric(15,2),
    payment_due_date integer,
    start_date date,
    maturity_date date,
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 237 (class 1259 OID 18100)
-- Name: debts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.debts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4669 (class 0 OID 0)
-- Dependencies: 237
-- Name: debts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.debts_id_seq OWNED BY public.debts.id;


--
-- TOC entry 230 (class 1259 OID 18029)
-- Name: financial_goals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.financial_goals (
    id integer NOT NULL,
    user_id integer,
    account_id integer,
    name character varying(255) NOT NULL,
    description text,
    target_amount numeric(15,2) NOT NULL,
    current_amount numeric(15,2) DEFAULT 0,
    target_date date,
    priority character varying(20) DEFAULT 'medium'::character varying,
    goal_type character varying(50),
    auto_save_amount numeric(15,2) DEFAULT 0,
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 229 (class 1259 OID 18028)
-- Name: financial_goals_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.financial_goals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4670 (class 0 OID 0)
-- Dependencies: 229
-- Name: financial_goals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.financial_goals_id_seq OWNED BY public.financial_goals.id;


--
-- TOC entry 232 (class 1259 OID 18054)
-- Name: goal_contributions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.goal_contributions (
    id integer NOT NULL,
    goal_id integer,
    amount numeric(15,2) NOT NULL,
    date date NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 231 (class 1259 OID 18053)
-- Name: goal_contributions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.goal_contributions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4671 (class 0 OID 0)
-- Dependencies: 231
-- Name: goal_contributions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.goal_contributions_id_seq OWNED BY public.goal_contributions.id;


--
-- TOC entry 244 (class 1259 OID 18198)
-- Name: investment_instruments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.investment_instruments (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    symbol character varying(50) NOT NULL,
    asset_type character varying(50) NOT NULL,
    market character varying(100),
    currency character varying(10) DEFAULT 'IDR'::character varying,
    country character varying(50),
    description text,
    logo_url text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    price_source character varying(50) NOT NULL,
    price_mapping character varying(100) NOT NULL,
    last_price numeric(20,8),
    last_price_idr numeric(20,2),
    last_updated timestamp without time zone,
    price_fetch_error text,
    CONSTRAINT check_price_source_not_manual CHECK (((price_source)::text <> 'manual'::text))
);


--
-- TOC entry 4672 (class 0 OID 0)
-- Dependencies: 244
-- Name: COLUMN investment_instruments.price_source; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.investment_instruments.price_source IS 'API source for price fetching (manual not allowed, required)';


--
-- TOC entry 4673 (class 0 OID 0)
-- Dependencies: 244
-- Name: COLUMN investment_instruments.price_mapping; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.investment_instruments.price_mapping IS 'API ticker/ID for price fetching (required)';


--
-- TOC entry 4674 (class 0 OID 0)
-- Dependencies: 244
-- Name: COLUMN investment_instruments.last_price; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.investment_instruments.last_price IS 'Last successfully fetched price in original currency';


--
-- TOC entry 4675 (class 0 OID 0)
-- Dependencies: 244
-- Name: COLUMN investment_instruments.last_price_idr; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.investment_instruments.last_price_idr IS 'Last successfully fetched price in IDR';


--
-- TOC entry 4676 (class 0 OID 0)
-- Dependencies: 244
-- Name: COLUMN investment_instruments.last_updated; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.investment_instruments.last_updated IS 'Timestamp of last successful price fetch';


--
-- TOC entry 4677 (class 0 OID 0)
-- Dependencies: 244
-- Name: COLUMN investment_instruments.price_fetch_error; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.investment_instruments.price_fetch_error IS 'Last error message if price fetch failed';


--
-- TOC entry 243 (class 1259 OID 18197)
-- Name: investment_instruments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.investment_instruments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4678 (class 0 OID 0)
-- Dependencies: 243
-- Name: investment_instruments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.investment_instruments_id_seq OWNED BY public.investment_instruments.id;


--
-- TOC entry 234 (class 1259 OID 18069)
-- Name: investments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.investments (
    id integer NOT NULL,
    user_id integer,
    purchase_date date NOT NULL,
    purchase_price numeric(15,2) NOT NULL,
    quantity numeric(15,4) NOT NULL,
    platform character varying(100),
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    instrument_id integer NOT NULL
);


--
-- TOC entry 233 (class 1259 OID 18068)
-- Name: investments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.investments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4679 (class 0 OID 0)
-- Dependencies: 233
-- Name: investments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.investments_id_seq OWNED BY public.investments.id;


--
-- TOC entry 226 (class 1259 OID 17982)
-- Name: recurring_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recurring_transactions (
    id integer NOT NULL,
    user_id integer,
    account_id integer,
    category_id integer,
    type character varying(20) NOT NULL,
    amount numeric(15,2) NOT NULL,
    frequency character varying(20) NOT NULL,
    start_date date NOT NULL,
    end_date date,
    next_date date NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 225 (class 1259 OID 17981)
-- Name: recurring_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.recurring_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4680 (class 0 OID 0)
-- Dependencies: 225
-- Name: recurring_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.recurring_transactions_id_seq OWNED BY public.recurring_transactions.id;


--
-- TOC entry 224 (class 1259 OID 17955)
-- Name: transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions (
    id integer NOT NULL,
    user_id integer,
    account_id integer,
    category_id integer,
    type character varying(20) NOT NULL,
    amount numeric(15,2) NOT NULL,
    date date NOT NULL,
    description text,
    notes text,
    merchant character varying(255),
    tags text[],
    is_recurring boolean DEFAULT false,
    recurring_id integer,
    receipt_url text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 223 (class 1259 OID 17954)
-- Name: transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4681 (class 0 OID 0)
-- Dependencies: 223
-- Name: transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.transactions_id_seq OWNED BY public.transactions.id;


--
-- TOC entry 218 (class 1259 OID 17906)
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    password_hash character varying(255) NOT NULL
);


--
-- TOC entry 217 (class 1259 OID 17905)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4682 (class 0 OID 0)
-- Dependencies: 217
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 4367 (class 2604 OID 17922)
-- Name: accounts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts ALTER COLUMN id SET DEFAULT nextval('public.accounts_id_seq'::regclass);


--
-- TOC entry 4400 (class 2604 OID 18088)
-- Name: assets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets ALTER COLUMN id SET DEFAULT nextval('public.assets_id_seq'::regclass);


--
-- TOC entry 4383 (class 2604 OID 18011)
-- Name: budgets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budgets ALTER COLUMN id SET DEFAULT nextval('public.budgets_id_seq'::regclass);


--
-- TOC entry 4373 (class 2604 OID 17939)
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- TOC entry 4409 (class 2604 OID 18134)
-- Name: credit_cards id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_cards ALTER COLUMN id SET DEFAULT nextval('public.credit_cards_id_seq'::regclass);


--
-- TOC entry 4407 (class 2604 OID 18119)
-- Name: debt_payments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debt_payments ALTER COLUMN id SET DEFAULT nextval('public.debt_payments_id_seq'::regclass);


--
-- TOC entry 4403 (class 2604 OID 18104)
-- Name: debts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debts ALTER COLUMN id SET DEFAULT nextval('public.debts_id_seq'::regclass);


--
-- TOC entry 4388 (class 2604 OID 18032)
-- Name: financial_goals id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_goals ALTER COLUMN id SET DEFAULT nextval('public.financial_goals_id_seq'::regclass);


--
-- TOC entry 4395 (class 2604 OID 18057)
-- Name: goal_contributions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goal_contributions ALTER COLUMN id SET DEFAULT nextval('public.goal_contributions_id_seq'::regclass);


--
-- TOC entry 4415 (class 2604 OID 18201)
-- Name: investment_instruments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.investment_instruments ALTER COLUMN id SET DEFAULT nextval('public.investment_instruments_id_seq'::regclass);


--
-- TOC entry 4397 (class 2604 OID 18072)
-- Name: investments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.investments ALTER COLUMN id SET DEFAULT nextval('public.investments_id_seq'::regclass);


--
-- TOC entry 4380 (class 2604 OID 17985)
-- Name: recurring_transactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_transactions ALTER COLUMN id SET DEFAULT nextval('public.recurring_transactions_id_seq'::regclass);


--
-- TOC entry 4376 (class 2604 OID 17958)
-- Name: transactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions ALTER COLUMN id SET DEFAULT nextval('public.transactions_id_seq'::regclass);


--
-- TOC entry 4364 (class 2604 OID 17909)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 4633 (class 0 OID 17919)
-- Dependencies: 220
-- Data for Name: accounts; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.accounts VALUES (2, 1, 'Mandiri Tabungan', 'bank', 8500000.00, 'IDR', 'Building2', '#f59e0b', true, '2025-12-04 21:29:32.724357', '2025-12-04 21:29:32.724357');
INSERT INTO public.accounts VALUES (5, 1, 'OVO', 'e-wallet', 150000.00, 'IDR', 'Smartphone', '#4c3494', true, '2025-12-04 21:29:32.724357', '2025-12-04 21:29:32.724357');
INSERT INTO public.accounts VALUES (6, 1, 'BCA Credit Card', 'credit_card', -2500000.00, 'IDR', 'CreditCard', '#ef4444', true, '2025-12-04 21:29:32.724357', '2025-12-04 21:29:32.724357');
INSERT INTO public.accounts VALUES (4, 1, 'GoPay', 'e-wallet', 250000.00, 'IDR', 'Smartphone', '#00aa13', true, '2025-12-04 21:29:32.724357', '2025-12-04 21:29:32.724357');
INSERT INTO public.accounts VALUES (7, 1, 'sadas', 'cash', 1111.00, 'IDR', NULL, '#3B82F6', true, '2025-12-08 01:55:29.958964', '2025-12-08 01:55:29.958964');
INSERT INTO public.accounts VALUES (3, 1, 'Dompet', 'cash', 450000.00, 'IDR', 'Wallet', '#10b981', true, '2025-12-04 21:29:32.724357', '2025-12-04 21:29:32.724357');
INSERT INTO public.accounts VALUES (8, 1, 'adasq', 'cash', 111111.00, 'IDR', NULL, '#3B82F6', true, '2025-12-08 15:08:33.225316', '2025-12-08 15:08:33.225316');
INSERT INTO public.accounts VALUES (1, 1, 'BCA Tahapan', 'bank', 19508888.00, 'IDR', 'Building2', '#1a80b0', true, '2025-12-04 21:29:32.724357', '2025-12-04 21:29:32.724357');


--
-- TOC entry 4649 (class 0 OID 18085)
-- Dependencies: 236
-- Data for Name: assets; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.assets VALUES (1, 1, 'Motor Honda PCX', 'vehicle', '2022-05-15', 35000000.00, 28000000.00, 10.00, NULL, '2025-12-04 21:29:32.724357', '2025-12-04 21:29:32.724357');
INSERT INTO public.assets VALUES (2, 1, 'MacBook Pro M1', 'electronics', '2023-01-20', 22000000.00, 16000000.00, 15.00, NULL, '2025-12-04 21:29:32.724357', '2025-12-04 21:29:32.724357');
INSERT INTO public.assets VALUES (3, 1, 'iPhone 14 Pro', 'electronics', '2023-09-25', 18000000.00, 13000000.00, 20.00, NULL, '2025-12-04 21:29:32.724357', '2025-12-04 21:29:32.724357');


--
-- TOC entry 4641 (class 0 OID 18008)
-- Dependencies: 228
-- Data for Name: budgets; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.budgets VALUES (12, 1, 8, 1000000.00, '2025-12-03', '2025-12-30', false, 80.00, '2025-12-04 15:57:30.181296', '2025-12-04 16:08:43.152718');
INSERT INTO public.budgets VALUES (13, 1, 5, 2121412321.00, '2025-12-08', '2025-12-31', false, 80.00, '2025-12-08 01:55:53.891489', '2025-12-08 01:55:53.891489');
INSERT INTO public.budgets VALUES (14, 1, 9, 1290123.00, '2025-12-08', '2025-12-10', false, 80.00, '2025-12-08 15:11:35.328611', '2025-12-08 15:11:35.328611');
INSERT INTO public.budgets VALUES (16, 1, 6, 500000.00, '2025-12-08', '2025-12-19', false, 80.00, '2025-12-08 15:12:09.83212', '2025-12-08 15:12:09.83212');
INSERT INTO public.budgets VALUES (17, 1, 13, 100000.00, '2025-12-08', '2025-12-12', false, 80.00, '2025-12-08 15:14:10.365454', '2025-12-08 15:14:10.365454');
INSERT INTO public.budgets VALUES (18, 1, 5, 100000.00, '2025-12-09', '2025-12-31', false, 80.00, '2025-12-09 07:24:55.288432', '2025-12-09 07:24:55.288432');


--
-- TOC entry 4635 (class 0 OID 17936)
-- Dependencies: 222
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.categories VALUES (1, 1, 'Gaji', 'income', NULL, 'Briefcase', '#10b981', NULL, true, '2025-12-04 21:29:32.724357');
INSERT INTO public.categories VALUES (2, 1, 'Freelance', 'income', NULL, 'Code', '#3b82f6', NULL, true, '2025-12-04 21:29:32.724357');
INSERT INTO public.categories VALUES (3, 1, 'Bonus', 'income', NULL, 'Gift', '#8b5cf6', NULL, true, '2025-12-04 21:29:32.724357');
INSERT INTO public.categories VALUES (4, 1, 'Investment Returns', 'income', NULL, 'TrendingUp', '#06b6d4', NULL, true, '2025-12-04 21:29:32.724357');
INSERT INTO public.categories VALUES (5, 1, 'Makanan & Groceries', 'expense', NULL, 'ShoppingCart', '#f59e0b', 'needs', true, '2025-12-04 21:29:32.724357');
INSERT INTO public.categories VALUES (6, 1, 'Transport', 'expense', NULL, 'Car', '#ef4444', 'needs', true, '2025-12-04 21:29:32.724357');
INSERT INTO public.categories VALUES (7, 1, 'Utilitas', 'expense', NULL, 'Zap', '#06b6d4', 'needs', true, '2025-12-04 21:29:32.724357');
INSERT INTO public.categories VALUES (8, 1, 'Sewa/KPR', 'expense', NULL, 'Home', '#8b5cf6', 'needs', true, '2025-12-04 21:29:32.724357');
INSERT INTO public.categories VALUES (9, 1, 'Asuransi', 'expense', NULL, 'Shield', '#10b981', 'needs', true, '2025-12-04 21:29:32.724357');
INSERT INTO public.categories VALUES (10, 1, 'Healthcare', 'expense', NULL, 'Heart', '#ec4899', 'needs', true, '2025-12-04 21:29:32.724357');
INSERT INTO public.categories VALUES (11, 1, 'Entertainment', 'expense', NULL, 'Film', '#a855f7', 'wants', true, '2025-12-04 21:29:32.724357');
INSERT INTO public.categories VALUES (12, 1, 'Makan di Luar', 'expense', NULL, 'UtensilsCrossed', '#f97316', 'wants', true, '2025-12-04 21:29:32.724357');
INSERT INTO public.categories VALUES (13, 1, 'Shopping', 'expense', NULL, 'ShoppingBag', '#ec4899', 'wants', true, '2025-12-04 21:29:32.724357');
INSERT INTO public.categories VALUES (14, 1, 'Subscription', 'expense', NULL, 'Repeat', '#06b6d4', 'wants', true, '2025-12-04 21:29:32.724357');
INSERT INTO public.categories VALUES (15, 1, 'Travel', 'expense', NULL, 'Plane', '#3b82f6', 'wants', true, '2025-12-04 21:29:32.724357');
INSERT INTO public.categories VALUES (16, 1, 'Emergency Fund', 'expense', NULL, 'AlertCircle', '#10b981', 'savings', true, '2025-12-04 21:29:32.724357');
INSERT INTO public.categories VALUES (17, 1, 'Investasi', 'expense', NULL, 'TrendingUp', '#3b82f6', 'savings', true, '2025-12-04 21:29:32.724357');
INSERT INTO public.categories VALUES (18, 1, 'Tabungan', 'expense', NULL, 'PiggyBank', '#8b5cf6', 'savings', true, '2025-12-04 21:29:32.724357');
INSERT INTO public.categories VALUES (19, 1, 'ngewe', 'expense', NULL, '🎮', '#6366f1', 'savings', true, '2025-12-06 17:30:02.086021');
INSERT INTO public.categories VALUES (20, 1, 'haha', 'expense', NULL, '☕', '#6366f1', 'needs', true, '2025-12-06 17:33:59.758957');


--
-- TOC entry 4655 (class 0 OID 18131)
-- Dependencies: 242
-- Data for Name: credit_cards; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.credit_cards VALUES (1, 1, 6, 'BCA Everyday Card', 'BCA', 10000000.00, 2500000.00, 1, 15, 2.95, 'BCA Rewards', 125000.00, true, '2025-12-04 21:29:32.724357', '2025-12-04 21:29:32.724357');


--
-- TOC entry 4653 (class 0 OID 18116)
-- Dependencies: 240
-- Data for Name: debt_payments; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.debt_payments VALUES (1, 5, 1000.00, '2025-12-09', 1000.00, 0.00, NULL, '2025-12-09 07:41:17.928959');
INSERT INTO public.debt_payments VALUES (2, 5, 1000.00, '2025-12-09', 1000.00, 0.00, NULL, '2025-12-09 07:41:49.556328');
INSERT INTO public.debt_payments VALUES (3, 4, 1000000.00, '2025-12-09', 989166.67, 10833.33, NULL, '2025-12-09 07:42:29.618126');
INSERT INTO public.debt_payments VALUES (4, 4, 1000000.00, '2025-12-09', 999882.64, 117.36, NULL, '2025-12-09 07:42:46.165468');
INSERT INTO public.debt_payments VALUES (5, 4, 1000000.00, '2025-12-09', 999882.64, 117.36, NULL, '2025-12-09 07:42:46.179342');
INSERT INTO public.debt_payments VALUES (6, 4, 1000000.00, '2025-12-09', 1000000.00, 0.00, NULL, '2025-12-09 07:44:10.139276');
INSERT INTO public.debt_payments VALUES (7, 4, 1000000.00, '2025-12-09', 1000000.00, 0.00, NULL, '2025-12-09 07:44:10.14458');
INSERT INTO public.debt_payments VALUES (8, 4, 1000000.00, '2025-12-09', 1000000.00, 0.00, NULL, '2025-12-09 07:48:05.407451');
INSERT INTO public.debt_payments VALUES (9, 3, 1000.00, '2025-12-09', 991.67, 8.33, NULL, '2025-12-09 07:53:01.300977');
INSERT INTO public.debt_payments VALUES (10, 3, 8.00, '2025-12-09', 7.93, 0.07, NULL, '2025-12-09 07:53:14.665772');
INSERT INTO public.debt_payments VALUES (11, 1, 250000.00, '2025-12-09', 243854.17, 6145.83, NULL, '2025-12-09 08:02:20.868456');


--
-- TOC entry 4651 (class 0 OID 18101)
-- Dependencies: 238
-- Data for Name: debts; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.debts VALUES (2, 1, 'personal_loan', 'Bank Mandiri KTA', 20000000.00, 12000000.00, 12.50, 600000.00, 10, '2023-06-01', '2026-06-01', 'active', '2025-12-04 21:29:32.724357', '2025-12-04 21:29:32.724357');
INSERT INTO public.debts VALUES (5, 1, 'student', 'sadasdadsa', 1000000.00, 0.00, 1.00, 1000.00, 2, '2025-12-09', NULL, 'paid_off', '2025-12-09 07:30:30.228425', '2025-12-09 07:41:49.556328');
INSERT INTO public.debts VALUES (4, 1, 'mortgage', 'njancuki', 300000000.00, 0.00, 13.00, 1000000.00, 1, '2025-12-09', NULL, 'paid_off', '2025-12-09 07:29:52.330277', '2025-12-09 07:48:05.407451');
INSERT INTO public.debts VALUES (3, 1, 'personal', 'dsasasadsad', 1000000.00, 0.40, 10.00, 1000.00, 12, '2025-12-09', NULL, 'active', '2025-12-09 07:28:57.140761', '2025-12-09 07:53:14.665772');
INSERT INTO public.debts VALUES (1, 1, 'credit_card', 'BCA Credit Card', 5000000.00, 2256145.83, 2.95, 250000.00, 15, '2024-01-01', NULL, 'active', '2025-12-04 21:29:32.724357', '2025-12-09 08:02:20.868456');


--
-- TOC entry 4643 (class 0 OID 18029)
-- Dependencies: 230
-- Data for Name: financial_goals; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.financial_goals VALUES (1, 1, 2, 'Emergency Fund', 'Dana darurat 6x pengeluaran bulanan', 36000000.00, 12000000.00, '2026-12-04', 'high', 'emergency_fund', 2000000.00, 'active', '2025-12-04 21:29:32.724357', '2025-12-04 21:29:32.724357');
INSERT INTO public.financial_goals VALUES (3, 1, 1, 'DP Rumah', 'Down payment rumah', 150000000.00, 30000000.00, '2027-12-04', 'high', 'home', 3000000.00, 'active', '2025-12-04 21:29:32.724357', '2025-12-04 21:29:32.724357');
INSERT INTO public.financial_goals VALUES (4, 1, 2, 'Gadget Fund', 'Beli iPhone baru', 15000000.00, 8000000.00, '2026-04-04', 'low', 'shopping', 500000.00, 'active', '2025-12-04 21:29:32.724357', '2025-12-04 21:29:32.724357');
INSERT INTO public.financial_goals VALUES (2, 1, 1, 'Liburan ke Jepang', 'Liburan keluarga 2025', 25000000.00, 5050000.00, '2026-06-04', 'medium', 'vacation', 1000000.00, 'active', '2025-12-04 21:29:32.724357', '2025-12-04 21:29:32.724357');
INSERT INTO public.financial_goals VALUES (5, 1, NULL, 'duit tambahan', NULL, 1000000.00, 420000.00, '2026-01-01', 'medium', NULL, 0.00, 'active', '2025-12-08 15:25:41.363116', '2025-12-08 15:25:41.363116');
INSERT INTO public.financial_goals VALUES (7, 1, NULL, 'untuk ngising', NULL, 1000000.00, 0.00, '2025-12-31', 'medium', NULL, 0.00, 'active', '2025-12-08 15:31:12.092906', '2025-12-08 15:31:12.092906');
INSERT INTO public.financial_goals VALUES (8, 1, NULL, 'sadasdad', 'adssdasadasdas', 1000000.00, 0.00, '2025-12-25', 'medium', NULL, 0.00, 'active', '2025-12-09 07:25:20.028287', '2025-12-09 07:25:20.028287');


--
-- TOC entry 4645 (class 0 OID 18054)
-- Dependencies: 232
-- Data for Name: goal_contributions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.goal_contributions VALUES (1, 1, 2000000.00, '2025-11-09', 'Monthly contribution', '2025-12-04 21:29:32.724357');
INSERT INTO public.goal_contributions VALUES (2, 2, 1000000.00, '2025-11-09', 'Monthly contribution', '2025-12-04 21:29:32.724357');
INSERT INTO public.goal_contributions VALUES (3, 3, 3000000.00, '2025-11-09', 'Monthly contribution', '2025-12-04 21:29:32.724357');
INSERT INTO public.goal_contributions VALUES (4, 4, 500000.00, '2025-11-09', 'Monthly contribution', '2025-12-04 21:29:32.724357');
INSERT INTO public.goal_contributions VALUES (5, 2, 50000.00, '2025-12-08', NULL, '2025-12-08 15:25:55.853904');
INSERT INTO public.goal_contributions VALUES (6, 5, 200000.00, '2025-12-08', NULL, '2025-12-08 15:26:36.848821');
INSERT INTO public.goal_contributions VALUES (7, 5, 200000.00, '2025-12-08', NULL, '2025-12-08 15:26:37.720389');
INSERT INTO public.goal_contributions VALUES (8, 5, 10000.00, '2025-12-08', NULL, '2025-12-08 15:30:48.342194');


--
-- TOC entry 4657 (class 0 OID 18198)
-- Dependencies: 244
-- Data for Name: investment_instruments; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.investment_instruments VALUES (18, 'Bitcoin', 'BTC', 'crypto', 'Crypto', 'USD', 'Global', NULL, NULL, true, '2025-12-07 00:06:08.19283', '2025-12-07 00:06:08.19283', 'CoinGecko', 'bitcoin', 90167.00000000, 1503164112.00, '2025-12-09 14:19:24.629', NULL);
INSERT INTO public.investment_instruments VALUES (20, 'Binance Coin', 'BNB', 'crypto', 'Crypto', 'USD', 'Global', NULL, NULL, true, '2025-12-07 00:06:08.19283', '2025-12-07 00:06:08.19283', 'CoinGecko', 'binancecoin', 887.56000000, 14796339.00, '2025-12-09 14:19:24.778', NULL);
INSERT INTO public.investment_instruments VALUES (23, 'Solana', 'SOL', 'crypto', 'Crypto', 'USD', 'Global', NULL, NULL, true, '2025-12-07 00:06:08.19283', '2025-12-07 00:06:08.19283', 'CoinGecko', 'solana', 132.49000000, 2208677.00, '2025-12-09 14:19:25.347', NULL);
INSERT INTO public.investment_instruments VALUES (3, 'PT Bank Rakyat Indonesia Tbk', 'BBRI', 'stocks_id', 'IDX', 'IDR', 'Indonesia', NULL, NULL, true, '2025-12-07 00:06:08.19283', '2025-12-07 00:06:08.19283', 'Yahoo Finance', 'BBRI.JK', 3660.00000000, 3660.00, '2025-12-09 14:19:26.266', NULL);
INSERT INTO public.investment_instruments VALUES (10, 'Alphabet Inc Class A', 'GOOGL', 'stocks_us', 'NASDAQ', 'USD', 'United States', NULL, NULL, true, '2025-12-07 00:06:08.19283', '2025-12-07 00:06:08.19283', 'Yahoo Finance', 'GOOGL', 313.72000000, 4956776.00, '2025-12-09 14:19:27.578', NULL);
INSERT INTO public.investment_instruments VALUES (9, 'NVIDIA Corporation', 'NVDA', 'stocks_us', 'NASDAQ', 'USD', 'United States', NULL, NULL, true, '2025-12-07 00:06:08.19283', '2025-12-07 00:06:08.19283', 'Yahoo Finance', 'NVDA', 183.41500000, 2897957.00, '2025-12-08 23:04:43.312', NULL);
INSERT INTO public.investment_instruments VALUES (12, 'Tesla Inc', 'TSLA', 'stocks_us', 'NASDAQ', 'USD', 'United States', NULL, NULL, true, '2025-12-07 00:06:08.19283', '2025-12-07 00:06:08.19283', 'Yahoo Finance', 'TSLA', 439.42000000, 6942836.00, '2025-12-08 23:04:43.345', NULL);
INSERT INTO public.investment_instruments VALUES (22, 'Cardano', 'ADA', 'crypto', 'Crypto', 'USD', 'Global', NULL, NULL, true, '2025-12-07 00:06:08.19283', '2025-12-07 00:06:08.19283', 'CoinGecko', 'cardano', 0.43489800, 7261.63, '2025-12-08 23:04:43.872', NULL);
INSERT INTO public.investment_instruments VALUES (26, 'Crude Oil', 'OIL', 'commodities', 'Commodity', 'USD', 'Global', NULL, NULL, true, '2025-12-07 00:06:08.19283', '2025-12-07 00:06:08.19283', 'Yahoo Finance', 'CL=F', 59.43000000, 938994.00, '2025-12-08 23:04:26.606', NULL);
INSERT INTO public.investment_instruments VALUES (25, 'Silver', 'SILVER', 'commodities', 'Commodity', 'USD', 'Global', NULL, NULL, true, '2025-12-07 00:06:08.19283', '2025-12-07 00:06:08.19283', 'Yahoo Finance', 'SI=F', 58.47000000, 923826.00, '2025-12-08 23:04:27.222', NULL);
INSERT INTO public.investment_instruments VALUES (24, 'Gold', 'GOLD', 'commodities', 'Commodity', 'USD', 'Global', NULL, NULL, true, '2025-12-07 00:06:08.19283', '2025-12-07 00:06:08.19283', 'Yahoo Finance', 'GC=F', 4216.40000000, 66619120.00, '2025-12-08 23:04:27.481', NULL);
INSERT INTO public.investment_instruments VALUES (4, 'PT Bank Negara Indonesia Tbk', 'BBNI', 'stocks_id', 'IDX', 'IDR', 'Indonesia', NULL, NULL, true, '2025-12-07 00:06:08.19283', '2025-12-07 00:06:08.19283', 'Yahoo Finance', 'BBNI.JK', 4310.00000000, 4310.00, '2025-12-08 23:04:29.602', NULL);
INSERT INTO public.investment_instruments VALUES (2, 'PT Bank Mandiri Tbk', 'BMRI', 'stocks_id', 'IDX', 'IDR', 'Indonesia', NULL, NULL, true, '2025-12-07 00:06:08.19283', '2025-12-07 00:06:08.19283', 'Yahoo Finance', 'BMRI.JK', 4950.00000000, 4950.00, '2025-12-08 23:04:29.616', NULL);
INSERT INTO public.investment_instruments VALUES (1, 'PT Bank Central Asia Tbk', 'BBCA', 'stocks_id', 'IDX', 'IDR', 'Indonesia', NULL, NULL, true, '2025-12-07 00:06:08.19283', '2025-12-07 00:06:08.19283', 'Yahoo Finance', 'BBCA.JK', 8300.00000000, 8300.00, '2025-12-08 23:04:29.648', NULL);
INSERT INTO public.investment_instruments VALUES (5, 'PT Telkom Indonesia Tbk', 'TLKM', 'stocks_id', 'IDX', 'IDR', 'Indonesia', NULL, NULL, true, '2025-12-07 00:06:08.19283', '2025-12-07 00:06:08.19283', 'Yahoo Finance', 'TLKM.JK', 3630.00000000, 3630.00, '2025-12-08 23:04:31.77', NULL);
INSERT INTO public.investment_instruments VALUES (6, 'PT Unilever Indonesia Tbk', 'UNVR', 'stocks_id', 'IDX', 'IDR', 'Indonesia', NULL, NULL, true, '2025-12-07 00:06:08.19283', '2025-12-07 00:06:08.19283', 'Yahoo Finance', 'UNVR.JK', 2620.00000000, 2620.00, '2025-12-08 23:04:31.773', NULL);
INSERT INTO public.investment_instruments VALUES (11, 'Amazon.com Inc', 'AMZN', 'stocks_us', 'NASDAQ', 'USD', 'United States', NULL, NULL, true, '2025-12-07 00:06:08.19283', '2025-12-07 00:06:08.19283', 'Yahoo Finance', 'AMZN', 227.69000000, 3597502.00, '2025-12-08 23:04:34.733', NULL);
INSERT INTO public.investment_instruments VALUES (7, 'Apple Inc', 'AAPL', 'stocks_us', 'NASDAQ', 'USD', 'United States', NULL, NULL, true, '2025-12-07 00:06:08.19283', '2025-12-07 00:06:08.19283', 'Yahoo Finance', 'AAPL', 277.55000000, 4385290.00, '2025-12-08 23:04:35.062', NULL);
INSERT INTO public.investment_instruments VALUES (27, 'NASDAQ', 'IPY', 'stocks_us', 'IDX', 'IDR', 'Indonesia', NULL, NULL, true, '2025-12-06 17:30:49.605873', '2025-12-06 17:30:49.605873', 'yahoo_finance', 'IPY', NULL, NULL, '2025-12-08 10:21:07.539', 'Yahoo: Invalid response structure or no price available');
INSERT INTO public.investment_instruments VALUES (8, 'Microsoft Corporation', 'MSFT', 'stocks_us', 'NASDAQ', 'USD', 'United States', NULL, NULL, true, '2025-12-07 00:06:08.19283', '2025-12-07 00:06:08.19283', 'Yahoo Finance', 'MSFT', 490.33800000, 7747340.40, '2025-12-08 23:04:37.963', NULL);
INSERT INTO public.investment_instruments VALUES (13, 'Meta Platforms Inc', 'META', 'stocks_us', 'NASDAQ', 'USD', 'United States', NULL, NULL, true, '2025-12-07 00:06:08.19283', '2025-12-07 00:06:08.19283', 'Yahoo Finance', 'META', 668.70000000, 10565460.00, '2025-12-08 23:04:38.098', NULL);
INSERT INTO public.investment_instruments VALUES (21, 'Ripple', 'XRP', 'crypto', 'Crypto', 'USD', 'Global', NULL, NULL, true, '2025-12-07 00:06:08.19283', '2025-12-07 00:06:08.19283', 'CoinGecko', 'ripple', 2.07000000, 34618.00, '2025-12-08 23:04:43.98', NULL);
INSERT INTO public.investment_instruments VALUES (19, 'Ethereum', 'ETH', 'crypto', 'Crypto', 'USD', 'Global', NULL, NULL, true, '2025-12-07 00:06:08.19283', '2025-12-07 00:06:08.19283', 'CoinGecko', 'ethereum', 3095.37000000, 51684488.00, '2025-12-08 23:04:44.202', NULL);


--
-- TOC entry 4647 (class 0 OID 18069)
-- Dependencies: 234
-- Data for Name: investments; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.investments VALUES (6, 1, '2025-12-05', 122.00, 44.0000, NULL, NULL, '2025-12-06 17:32:06.846461', '2025-12-06 17:32:36.158389', 10);
INSERT INTO public.investments VALUES (7, 1, '2025-12-08', 110.99, 120.0000, NULL, NULL, '2025-12-08 01:56:30.580062', '2025-12-08 01:56:30.580062', 20);
INSERT INTO public.investments VALUES (4, 1, '2023-08-14', 450000000.00, 0.0500, 'Indodax', '', '2025-12-04 21:29:32.724357', '2025-12-08 02:36:06.359454', 18);
INSERT INTO public.investments VALUES (10, 1, '2025-12-08', 1700000.00, 5.0000, 'ipot', NULL, '2025-12-08 09:07:28.785305', '2025-12-08 09:07:28.785305', 23);
INSERT INTO public.investments VALUES (11, 1, '2025-12-08', 1500.00, 100.0000, 'stockbit', NULL, '2025-12-08 15:36:44.15276', '2025-12-08 15:36:44.15276', 3);
INSERT INTO public.investments VALUES (12, 1, '2025-12-08', 50.00, 100000.0000, NULL, NULL, '2025-12-09 07:19:40.177739', '2025-12-09 07:19:40.177739', 23);


--
-- TOC entry 4639 (class 0 OID 17982)
-- Dependencies: 226
-- Data for Name: recurring_transactions; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 4637 (class 0 OID 17955)
-- Dependencies: 224
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.transactions VALUES (1, 1, 1, 1, 'income', 12000000.00, '2025-11-09', 'Gaji Bulan November', NULL, 'PT Example Company', NULL, false, NULL, NULL, '2025-12-04 21:29:32.724357', '2025-12-04 21:29:32.724357');
INSERT INTO public.transactions VALUES (2, 1, 1, 2, 'income', 3500000.00, '2025-11-19', 'Project Web Development', NULL, 'Client XYZ', NULL, false, NULL, NULL, '2025-12-04 21:29:32.724357', '2025-12-04 21:29:32.724357');
INSERT INTO public.transactions VALUES (3, 1, 1, 5, 'expense', 500000.00, '2025-11-11', 'Belanja bulanan', NULL, 'Superindo', NULL, false, NULL, NULL, '2025-12-04 21:29:32.724357', '2025-12-04 21:29:32.724357');
INSERT INTO public.transactions VALUES (4, 1, 3, 5, 'expense', 150000.00, '2025-11-14', 'Sayur dan buah', NULL, 'Pasar', NULL, false, NULL, NULL, '2025-12-04 21:29:32.724357', '2025-12-04 21:29:32.724357');
INSERT INTO public.transactions VALUES (5, 1, 4, 6, 'expense', 200000.00, '2025-11-12', 'Bensin', NULL, 'Shell', NULL, false, NULL, NULL, '2025-12-04 21:29:32.724357', '2025-12-04 21:29:32.724357');
INSERT INTO public.transactions VALUES (6, 1, 4, 6, 'expense', 50000.00, '2025-11-16', 'Parkir dan tol', NULL, NULL, NULL, false, NULL, NULL, '2025-12-04 21:29:32.724357', '2025-12-04 21:29:32.724357');
INSERT INTO public.transactions VALUES (7, 1, 1, 7, 'expense', 350000.00, '2025-11-14', 'Listrik bulan November', NULL, 'PLN', NULL, false, NULL, NULL, '2025-12-04 21:29:32.724357', '2025-12-04 21:29:32.724357');
INSERT INTO public.transactions VALUES (8, 1, 1, 7, 'expense', 300000.00, '2025-11-15', 'Internet Indihome', NULL, 'Telkom', NULL, false, NULL, NULL, '2025-12-04 21:29:32.724357', '2025-12-04 21:29:32.724357');
INSERT INTO public.transactions VALUES (9, 1, 1, 8, 'expense', 3000000.00, '2025-12-03', 'Sewa kost', NULL, 'Ibu Kost', NULL, false, NULL, NULL, '2025-12-04 21:29:32.724357', '2025-12-04 21:29:32.724357');
INSERT INTO public.transactions VALUES (10, 1, 1, 9, 'expense', 500000.00, '2025-11-19', 'Asuransi kesehatan', NULL, 'Allianz', NULL, false, NULL, NULL, '2025-12-04 21:29:32.724357', '2025-12-04 21:29:32.724357');
INSERT INTO public.transactions VALUES (11, 1, 3, 10, 'expense', 250000.00, '2025-11-24', 'Periksa dokter', NULL, 'RS Siloam', NULL, false, NULL, NULL, '2025-12-04 21:29:32.724357', '2025-12-04 21:29:32.724357');
INSERT INTO public.transactions VALUES (12, 1, 4, 11, 'expense', 150000.00, '2025-11-22', 'Nonton film', NULL, 'CGV', NULL, false, NULL, NULL, '2025-12-04 21:29:32.724357', '2025-12-04 21:29:32.724357');
INSERT INTO public.transactions VALUES (13, 1, 5, 12, 'expense', 85000.00, '2025-11-26', 'Makan siang', NULL, 'Resto Padang', NULL, false, NULL, NULL, '2025-12-04 21:29:32.724357', '2025-12-04 21:29:32.724357');
INSERT INTO public.transactions VALUES (14, 1, 4, 12, 'expense', 120000.00, '2025-11-29', 'Dinner', NULL, 'Starbucks', NULL, false, NULL, NULL, '2025-12-04 21:29:32.724357', '2025-12-04 21:29:32.724357');
INSERT INTO public.transactions VALUES (15, 1, 6, 13, 'expense', 450000.00, '2025-11-20', 'Beli baju', NULL, 'Uniqlo', NULL, false, NULL, NULL, '2025-12-04 21:29:32.724357', '2025-12-04 21:29:32.724357');
INSERT INTO public.transactions VALUES (16, 1, 1, 14, 'expense', 49000.00, '2025-12-03', 'Netflix', NULL, 'Netflix', NULL, false, NULL, NULL, '2025-12-04 21:29:32.724357', '2025-12-04 21:29:32.724357');
INSERT INTO public.transactions VALUES (17, 1, 1, 14, 'expense', 54900.00, '2025-12-01', 'Spotify Premium', NULL, 'Spotify', NULL, false, NULL, NULL, '2025-12-04 21:29:32.724357', '2025-12-04 21:29:32.724357');
INSERT INTO public.transactions VALUES (18, 1, 1, 16, 'expense', 2000000.00, '2025-11-10', 'Transfer ke emergency fund', NULL, NULL, NULL, false, NULL, NULL, '2025-12-04 21:29:32.724357', '2025-12-04 21:29:32.724357');
INSERT INTO public.transactions VALUES (19, 1, 1, 17, 'expense', 1500000.00, '2025-11-10', 'Beli reksadana', NULL, 'Bibit', NULL, false, NULL, NULL, '2025-12-04 21:29:32.724357', '2025-12-04 21:29:32.724357');
INSERT INTO public.transactions VALUES (20, 1, 3, 5, 'expense', 75000.00, '2025-12-01', 'Groceries', NULL, 'Indomaret', NULL, false, NULL, NULL, '2025-12-04 21:29:32.724357', '2025-12-04 21:29:32.724357');
INSERT INTO public.transactions VALUES (21, 1, 4, 6, 'expense', 180000.00, '2025-12-02', 'Bensin', NULL, 'Pertamina', NULL, false, NULL, NULL, '2025-12-04 21:29:32.724357', '2025-12-04 21:29:32.724357');
INSERT INTO public.transactions VALUES (22, 1, 5, 12, 'expense', 95000.00, '2025-12-03', 'Makan siang', NULL, 'Bakmi GM', NULL, false, NULL, NULL, '2025-12-04 21:29:32.724357', '2025-12-04 21:29:32.724357');
INSERT INTO public.transactions VALUES (24, 1, 1, 7, 'expense', 100000.00, '2025-12-04', 'sadasdasd', ' asd aaadssad', 'asds ada s', NULL, false, NULL, NULL, '2025-12-04 15:02:25.484906', '2025-12-04 15:02:25.484906');
INSERT INTO public.transactions VALUES (23, 1, 4, 11, 'expense', 200000.00, '2025-12-03', 'sadsdasdas', NULL, 'Mall', NULL, false, NULL, NULL, '2025-12-04 21:29:32.724357', '2025-12-04 15:42:53.323405');
INSERT INTO public.transactions VALUES (27, 1, 1, 19, 'expense', 1112.00, '2025-12-06', NULL, NULL, NULL, NULL, false, NULL, NULL, '2025-12-06 17:33:18.589145', '2025-12-06 17:33:18.589145');
INSERT INTO public.transactions VALUES (28, 1, 3, 7, 'expense', 50000.00, '2025-12-08', 'sadasdq', NULL, NULL, NULL, false, NULL, NULL, '2025-12-08 15:03:23.481489', '2025-12-08 15:03:23.481489');
INSERT INTO public.transactions VALUES (29, 1, 1, 1, 'income', 5600000.00, '2025-12-08', NULL, NULL, NULL, NULL, false, NULL, NULL, '2025-12-08 15:03:41.416792', '2025-12-08 15:03:41.416792');
INSERT INTO public.transactions VALUES (30, 1, 1, 2, 'income', 10000.00, '2025-12-09', NULL, NULL, NULL, NULL, false, NULL, NULL, '2025-12-09 07:23:48.312876', '2025-12-09 07:23:48.312876');
INSERT INTO public.transactions VALUES (31, 1, 1, 5, 'expense', 1000000.00, '2025-12-09', NULL, NULL, NULL, NULL, false, NULL, NULL, '2025-12-09 07:24:02.354126', '2025-12-09 07:24:02.354126');


--
-- TOC entry 4631 (class 0 OID 17906)
-- Dependencies: 218
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users VALUES (1, 'demo@finance.com', 'Demo User', '2025-12-04 21:29:32.724357', '2025-12-04 21:29:32.724357', '$2a$10$jV3g3cfkj0933gHAg98RsuMGc9iROBfNfu.ejnRm.QRe0wjWloIV.');


--
-- TOC entry 4683 (class 0 OID 0)
-- Dependencies: 219
-- Name: accounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.accounts_id_seq', 8, true);


--
-- TOC entry 4684 (class 0 OID 0)
-- Dependencies: 235
-- Name: assets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.assets_id_seq', 3, true);


--
-- TOC entry 4685 (class 0 OID 0)
-- Dependencies: 227
-- Name: budgets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.budgets_id_seq', 18, true);


--
-- TOC entry 4686 (class 0 OID 0)
-- Dependencies: 221
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.categories_id_seq', 20, true);


--
-- TOC entry 4687 (class 0 OID 0)
-- Dependencies: 241
-- Name: credit_cards_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.credit_cards_id_seq', 1, true);


--
-- TOC entry 4688 (class 0 OID 0)
-- Dependencies: 239
-- Name: debt_payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.debt_payments_id_seq', 11, true);


--
-- TOC entry 4689 (class 0 OID 0)
-- Dependencies: 237
-- Name: debts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.debts_id_seq', 5, true);


--
-- TOC entry 4690 (class 0 OID 0)
-- Dependencies: 229
-- Name: financial_goals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.financial_goals_id_seq', 8, true);


--
-- TOC entry 4691 (class 0 OID 0)
-- Dependencies: 231
-- Name: goal_contributions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.goal_contributions_id_seq', 8, true);


--
-- TOC entry 4692 (class 0 OID 0)
-- Dependencies: 243
-- Name: investment_instruments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.investment_instruments_id_seq', 33, true);


--
-- TOC entry 4693 (class 0 OID 0)
-- Dependencies: 233
-- Name: investments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.investments_id_seq', 12, true);


--
-- TOC entry 4694 (class 0 OID 0)
-- Dependencies: 225
-- Name: recurring_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.recurring_transactions_id_seq', 1, false);


--
-- TOC entry 4695 (class 0 OID 0)
-- Dependencies: 223
-- Name: transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.transactions_id_seq', 31, true);


--
-- TOC entry 4696 (class 0 OID 0)
-- Dependencies: 217
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 1, true);


--
-- TOC entry 4426 (class 2606 OID 17929)
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- TOC entry 4448 (class 2606 OID 18094)
-- Name: assets assets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_pkey PRIMARY KEY (id);


--
-- TOC entry 4437 (class 2606 OID 18017)
-- Name: budgets budgets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT budgets_pkey PRIMARY KEY (id);


--
-- TOC entry 4428 (class 2606 OID 17943)
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- TOC entry 4455 (class 2606 OID 18141)
-- Name: credit_cards credit_cards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_cards
    ADD CONSTRAINT credit_cards_pkey PRIMARY KEY (id);


--
-- TOC entry 4453 (class 2606 OID 18124)
-- Name: debt_payments debt_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debt_payments
    ADD CONSTRAINT debt_payments_pkey PRIMARY KEY (id);


--
-- TOC entry 4450 (class 2606 OID 18109)
-- Name: debts debts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debts
    ADD CONSTRAINT debts_pkey PRIMARY KEY (id);


--
-- TOC entry 4440 (class 2606 OID 18042)
-- Name: financial_goals financial_goals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_goals
    ADD CONSTRAINT financial_goals_pkey PRIMARY KEY (id);


--
-- TOC entry 4443 (class 2606 OID 18062)
-- Name: goal_contributions goal_contributions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goal_contributions
    ADD CONSTRAINT goal_contributions_pkey PRIMARY KEY (id);


--
-- TOC entry 4460 (class 2606 OID 18209)
-- Name: investment_instruments investment_instruments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.investment_instruments
    ADD CONSTRAINT investment_instruments_pkey PRIMARY KEY (id);


--
-- TOC entry 4462 (class 2606 OID 18211)
-- Name: investment_instruments investment_instruments_symbol_market_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.investment_instruments
    ADD CONSTRAINT investment_instruments_symbol_market_key UNIQUE (symbol, market);


--
-- TOC entry 4446 (class 2606 OID 18078)
-- Name: investments investments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.investments
    ADD CONSTRAINT investments_pkey PRIMARY KEY (id);


--
-- TOC entry 4435 (class 2606 OID 17991)
-- Name: recurring_transactions recurring_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_transactions
    ADD CONSTRAINT recurring_transactions_pkey PRIMARY KEY (id);


--
-- TOC entry 4433 (class 2606 OID 17965)
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- TOC entry 4422 (class 2606 OID 17917)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4424 (class 2606 OID 17915)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4438 (class 1259 OID 18155)
-- Name: idx_budgets_user_period; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_budgets_user_period ON public.budgets USING btree (user_id, period_start, period_end);


--
-- TOC entry 4451 (class 1259 OID 18158)
-- Name: idx_debts_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_debts_user ON public.debts USING btree (user_id);


--
-- TOC entry 4441 (class 1259 OID 18156)
-- Name: idx_goals_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_goals_user ON public.financial_goals USING btree (user_id);


--
-- TOC entry 4456 (class 1259 OID 18219)
-- Name: idx_instruments_last_updated; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_instruments_last_updated ON public.investment_instruments USING btree (last_updated);


--
-- TOC entry 4457 (class 1259 OID 18218)
-- Name: idx_instruments_symbol; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_instruments_symbol ON public.investment_instruments USING btree (symbol);


--
-- TOC entry 4458 (class 1259 OID 18217)
-- Name: idx_instruments_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_instruments_type ON public.investment_instruments USING btree (asset_type);


--
-- TOC entry 4444 (class 1259 OID 18157)
-- Name: idx_investments_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_investments_user ON public.investments USING btree (user_id);


--
-- TOC entry 4429 (class 1259 OID 18154)
-- Name: idx_transactions_account; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_account ON public.transactions USING btree (account_id);


--
-- TOC entry 4430 (class 1259 OID 18153)
-- Name: idx_transactions_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_category ON public.transactions USING btree (category_id);


--
-- TOC entry 4431 (class 1259 OID 18152)
-- Name: idx_transactions_user_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transactions_user_date ON public.transactions USING btree (user_id, date DESC);


--
-- TOC entry 4463 (class 2606 OID 17930)
-- Name: accounts accounts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4480 (class 2606 OID 18095)
-- Name: assets assets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4472 (class 2606 OID 18023)
-- Name: budgets budgets_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT budgets_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- TOC entry 4473 (class 2606 OID 18018)
-- Name: budgets budgets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT budgets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4464 (class 2606 OID 17949)
-- Name: categories categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- TOC entry 4465 (class 2606 OID 17944)
-- Name: categories categories_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4483 (class 2606 OID 18147)
-- Name: credit_cards credit_cards_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_cards
    ADD CONSTRAINT credit_cards_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE SET NULL;


--
-- TOC entry 4484 (class 2606 OID 18142)
-- Name: credit_cards credit_cards_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.credit_cards
    ADD CONSTRAINT credit_cards_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4482 (class 2606 OID 18125)
-- Name: debt_payments debt_payments_debt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debt_payments
    ADD CONSTRAINT debt_payments_debt_id_fkey FOREIGN KEY (debt_id) REFERENCES public.debts(id) ON DELETE CASCADE;


--
-- TOC entry 4481 (class 2606 OID 18110)
-- Name: debts debts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.debts
    ADD CONSTRAINT debts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4474 (class 2606 OID 18048)
-- Name: financial_goals financial_goals_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_goals
    ADD CONSTRAINT financial_goals_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE SET NULL;


--
-- TOC entry 4475 (class 2606 OID 18043)
-- Name: financial_goals financial_goals_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_goals
    ADD CONSTRAINT financial_goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4477 (class 2606 OID 18220)
-- Name: investments fk_investments_instrument; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.investments
    ADD CONSTRAINT fk_investments_instrument FOREIGN KEY (instrument_id) REFERENCES public.investment_instruments(id) ON DELETE RESTRICT;


--
-- TOC entry 4476 (class 2606 OID 18063)
-- Name: goal_contributions goal_contributions_goal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.goal_contributions
    ADD CONSTRAINT goal_contributions_goal_id_fkey FOREIGN KEY (goal_id) REFERENCES public.financial_goals(id) ON DELETE CASCADE;


--
-- TOC entry 4478 (class 2606 OID 18212)
-- Name: investments investments_instrument_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.investments
    ADD CONSTRAINT investments_instrument_id_fkey FOREIGN KEY (instrument_id) REFERENCES public.investment_instruments(id) ON DELETE SET NULL;


--
-- TOC entry 4479 (class 2606 OID 18079)
-- Name: investments investments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.investments
    ADD CONSTRAINT investments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4469 (class 2606 OID 17997)
-- Name: recurring_transactions recurring_transactions_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_transactions
    ADD CONSTRAINT recurring_transactions_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE SET NULL;


--
-- TOC entry 4470 (class 2606 OID 18002)
-- Name: recurring_transactions recurring_transactions_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_transactions
    ADD CONSTRAINT recurring_transactions_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- TOC entry 4471 (class 2606 OID 17992)
-- Name: recurring_transactions recurring_transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_transactions
    ADD CONSTRAINT recurring_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4466 (class 2606 OID 17971)
-- Name: transactions transactions_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE SET NULL;


--
-- TOC entry 4467 (class 2606 OID 17976)
-- Name: transactions transactions_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- TOC entry 4468 (class 2606 OID 17966)
-- Name: transactions transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


-- Completed on 2025-12-30 00:43:28

--
-- PostgreSQL database dump complete
--

\unrestrict dpNls966MwgKEsGaitYs0g2k50CWsT96Webj6gdMu6vj6zsBBebmw0SQlWIrBgx

