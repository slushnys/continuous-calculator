import { Table, Attribute, Entity, TransformFromDynamo, TransformToDynamo } from '@typedorm/common'

import { createConnection, WriteBatch } from '@typedorm/core'
import { DocumentClientV3 } from '@typedorm/document-client'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'

const calculationTable = new Table({
    name: 'dev-CalculationResultsTable',
    partitionKey: 'partitionKey',
    sortKey: 'sortKey',
})

export interface Calculation {
    partitionKey: string
    sortKey: string
    storedAt: string
    createdAt: Date
}
@Entity({
    name: 'calculation',
    primaryKey: {
        partitionKey: '{{partitionKey}}',
        sortKey: '{{sortKey}}',
    },
})
export class Calculation {
    @Attribute()
    partitionKey: string

    @Attribute()
    sortKey: string

    @Attribute()
    @TransformFromDynamo(({ value }) => new Date(value))
    @TransformToDynamo(({ value }: { value: Date }) => value.toISOString())
    createdAt: Date

    @Attribute()
    storedAt: string
}

const documentClient = new DocumentClientV3(new DynamoDBClient({}))

export const connection = createConnection({
    table: calculationTable,
    entities: [Calculation],
    documentClient,
})

export const makeCalculationRepository = (): {
    getCalculation: typeof getCalculation
    addCalculation: typeof addCalculation
} => {
    return {
        getCalculation,
        addCalculation,
    }
}

const getCalculation = async (partitionKey: string, sortKey: string): Promise<Calculation | undefined> => {
    const calculation = await connection.entityManager.findOne(Calculation, { partitionKey, sortKey })
    console.log('calculation stored', calculation)
    return calculation
}

const addCalculation = async (partitionKey: string, storedAt: string): Promise<void> => {
    const batch = new WriteBatch()
    const now = new Date()
    batch.addCreateItem<Calculation>({ partitionKey, sortKey: now.toISOString(), storedAt, createdAt: now })
    batch.addCreateItem<Calculation>({ partitionKey, sortKey: 'latest', storedAt, createdAt: now })

    const result = await connection.batchManager.write(batch, {
        backoffMultiplicationFactor: 1.2,
        maxRetryAttempts: 3,
        requestsConcurrencyLimit: 2,
    })

    console.log('Unprocessed items: ', result.unprocessedItems)
    console.log('Failed items: ', result.failedItems)
}
