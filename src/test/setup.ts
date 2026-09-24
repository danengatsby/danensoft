import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// jsdom nu implementează scrollTo; îl înlocuim ca să nu polueze ieșirea testelor.
vi.stubGlobal('scrollTo', vi.fn())

