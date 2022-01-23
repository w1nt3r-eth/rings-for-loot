import {BigNumber} from '@ethersproject/bignumber';
import {useEffect, useMemo} from 'react';
import {useQuery, useQueryClient} from 'react-query';
import {useRingsReader} from './hooks/contracts';

export type RingsBalances = {[key: string]: number};

function applyEvents(
  address: string,
  balances: RingsBalances,
  events: {
    operator: string;
    from: string;
    to: string;
    id: BigNumber;
    value: BigNumber;
  }[],
) {
  for (const event of events) {
    const id = event.id.toString();
    const delta = event.to.toLowerCase() == address.toLowerCase() ? +1 : -1;
    balances[id] = (balances[id] || 0) + delta * event.value.toNumber();
  }

  return balances;
}

export function useRingBalances({address, chainId}: {address: string; chainId: number}) {
  const ringsReader = useRingsReader();
  const client = useQueryClient();

  const filterIn = useMemo(
    () => ringsReader.filters.TransferSingle(undefined, undefined, address, undefined, undefined),
    [ringsReader, address],
  );

  const filterOut = useMemo(
    () => ringsReader.filters.TransferSingle(undefined, address, undefined, undefined, undefined),
    [ringsReader, address],
  );

  const key = useMemo(() => ['balances', {address, chainId}], [address, chainId]);
  const balances = useQuery(key, async () => {
    const [ins, outs] = await Promise.all([ringsReader.queryFilter(filterIn), ringsReader.queryFilter(filterOut)]);

    return applyEvents(
      address,
      {},
      [...ins, ...outs].map((e) => e.args),
    );
  });

  useEffect(() => {
    if (!balances.isSuccess) {
      return;
    }

    const onEvent = (operator, from, to, id, value, event) => {
      client.setQueryData(key, (data?: RingsBalances) => applyEvents(address, {...data}, [event.args]));
    };

    ringsReader.on(filterIn, onEvent);
    ringsReader.on(filterOut, onEvent);

    return () => {
      ringsReader.removeListener(filterIn, onEvent);
      ringsReader.removeListener(filterOut, onEvent);
    };
  }, [balances.isSuccess, key, address, ringsReader, filterIn, filterOut, client]);

  return balances;
}
