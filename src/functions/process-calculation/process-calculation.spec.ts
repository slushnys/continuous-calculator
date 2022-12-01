import { CalculationRepository } from 'src/repositories/calculation'

describe('test processing calculation logic', () => {
    const s3Send = jest.fn()
    const dynamoSend = jest.fn()
    const addCalculation = jest.fn()
    jest.mock('../../repositories/calculation', () => ({
        makeCalculationRepository: () => ({
            addCalculation,
        }),
    }))

    it('should calculate result correctly', async () => {
        const s3Client = {
            send: s3Send,
        }
        const { makeProcessCalculation } = await import('./process-calculation')
        s3Send.mockResolvedValueOnce(true)
        dynamoSend.mockResolvedValueOnce(true)
        const calculationRepository: Partial<CalculationRepository> = {
            addCalculation,
        }
        const processCalculation = makeProcessCalculation({
            s3Client: s3Client as any,

            calculationRepository: calculationRepository as CalculationRepository,
        })
        const result = await processCalculation({ firstNumber: 3, secondNumber: 5, userId: 'test' })
        expect(result).toEqual(8)
        expect(calculationRepository.addCalculation).toHaveBeenCalledTimes(1)
    })
})
