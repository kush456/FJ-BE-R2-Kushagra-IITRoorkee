/*
  Warnings:

  - You are about to drop the column `amountOwed` on the `ExpenseSplit` table. All the data in the column will be lost.
  - You are about to drop the column `amountPaid` on the `ExpenseSplit` table. All the data in the column will be lost.
  - You are about to drop the column `netBalance` on the `ExpenseSplit` table. All the data in the column will be lost.
  - You are about to drop the column `transactionId` on the `SharedExpense` table. All the data in the column will be lost.
  - Added the required column `amount` to the `ExpenseSplit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paid` to the `ExpenseSplit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paidById` to the `SharedExpense` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalAmount` to the `SharedExpense` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "SharedExpense" DROP CONSTRAINT "SharedExpense_transactionId_fkey";

-- DropIndex
DROP INDEX "SharedExpense_transactionId_key";

-- AlterTable
ALTER TABLE "ExpenseSplit" DROP COLUMN "amountOwed",
DROP COLUMN "amountPaid",
DROP COLUMN "netBalance",
ADD COLUMN     "amount" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "paid" BOOLEAN NOT NULL;

-- AlterTable
ALTER TABLE "SharedExpense" DROP COLUMN "transactionId",
ADD COLUMN     "paidById" TEXT NOT NULL,
ADD COLUMN     "totalAmount" DECIMAL(65,30) NOT NULL;
