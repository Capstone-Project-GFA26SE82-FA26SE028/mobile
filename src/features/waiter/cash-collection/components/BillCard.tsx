import { Text } from 'react-native';
import { Card } from '../../shared/components/UI';
import { money } from '../../shared/utils/rules';
import type { PreparedBill } from '../types';
export function BillCard({ value }: {
    value: PreparedBill;
}) {
    const bill = value.bill;
    return <Card><Text className="text-[17px] font-[700] text-[#183B32]">Hóa đơn {bill.billNumber}</Text>
    {bill.items.map(line => <Text key={line.billLineId}>{line.quantity} × {line.item.itemName || line.item.name || 'Món ăn'} · {money(line.lineTotal)}</Text>)}
    <Text>Tiền món: {money(bill.subTotal)}</Text><Text>Phí dịch vụ: {money(bill.serviceAmount)}</Text><Text>VAT: {money(bill.vatAmount)}</Text>
    <Text className="text-[24px] font-[700] text-[#12664C]">Tổng thu: {money(bill.totalAmount)}</Text>
  </Card>;
}
