/*
  Warnings:

  - You are about to drop the column `paid` on the `ExpenseSplit` table. All the data in the column will be lost.
  - You are about to drop the column `totalAmount` on the `SharedExpense` table. All the data in the column will be lost.
  - Added the required column `amount` to the `SharedExpense` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ExpenseSplit" DROP COLUMN "paid";

-- AlterTable
ALTER TABLE "SharedExpense" DROP COLUMN "totalAmount",
ADD COLUMN     "amount" DECIMAL(65,30) NOT NULL;
