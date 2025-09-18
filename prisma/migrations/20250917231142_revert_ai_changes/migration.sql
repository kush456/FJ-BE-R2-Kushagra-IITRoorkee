/*
  Warnings:

  - You are about to drop the column `amount` on the `ExpenseSplit` table. All the data in the column will be lost.
  - You are about to drop the column `amount` on the `SharedExpense` table. All the data in the column will be lost.
  - You are about to drop the column `paidById` on the `SharedExpense` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[transactionId]` on the table `SharedExpense` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `amountOwed` to the `ExpenseSplit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `amountPaid` to the `ExpenseSplit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `netBalance` to the `ExpenseSplit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transactionId` to the `SharedExpense` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ExpenseSplit" DROP COLUMN "amount",
ADD COLUMN     "amountOwed" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "amountPaid" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "netBalance" DECIMAL(65,30) NOT NULL;

-- AlterTable
ALTER TABLE "SharedExpense" DROP COLUMN "amount",
DROP COLUMN "paidById",
ADD COLUMN     "transactionId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "SharedExpense_transactionId_key" ON "SharedExpense"("transactionId");

-- AddForeignKey
ALTER TABLE "SharedExpense" ADD CONSTRAINT "SharedExpense_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
