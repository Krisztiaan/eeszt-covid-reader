import React, { useEffect, useState } from 'react';

import { useNetInfo } from '@react-native-community/netinfo';
import format from 'date-fns/format';
import parseDate from 'date-fns/parse';
import parseISO from 'date-fns/parseISO';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { BlurView } from 'expo-blur';
import { Camera } from 'expo-camera';
import { AnimatePresence } from 'moti';
import JWT from 'jwt-decode';
import { ActivityIndicator, StatusBar, StyleSheet } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import matchAll from 'match-all';

import QRFooterButton from './components/QRFooterButton';
import { Box, Space, Text, ThemeProvider } from './components/Theme';
import useThrottledCallback from './hooks/useThrottledCallback';
import useToggle from './hooks/useToggle';

import type { BarCodeScanningResult } from 'expo-camera';

type VedettsegiToken = {
  token: string;
} & (
  | {
      /** timestamp */
      ts: ISODateTimeString;

      /** citizenName */
      n: string;

      /** TAJ ID */
      id: string;

      /** vaccinationDate */
      vd: ISODateString;
    }
  | {
      id: string;
      sub: string;
      iss: 'EESZT' | string;
    }
);

function hasKeys<TKeys extends string[]>(
  o: unknown,
  ...keys: TKeys
): o is Record<ElementOf<TKeys>, unknown> {
  if (typeof o !== 'object') return false;
  if (!o) return false;
  const oKeys = Object.keys(o);
  return keys.every((v) => oKeys.find((oKey) => oKey === v));
}

function isEesztJwt(data: unknown): data is VedettsegiToken {
  console.log('validating', data);
  if (hasKeys(data, 'ts', 'n', 'id', 'vd')) return true; // EESZT app
  if (hasKeys(data, 'id', 'iss')) return data.iss === 'EESZT'; // Vedettsegi Kartya
  return false;
}

class NotRecognizedTokenError extends Error {
  message = 'Token is not an EESZT token';
}
/**
 * Decode and validate JWT.
 * @throws NotRecognizedTokenError
 * @param data from the QR code
 */
function parseTokenString(data: string): VedettsegiToken | undefined {
  const jwtString: JWTToken | undefined = data.split('/').pop();

  if (!jwtString) return undefined;

  const jwtObject = JWT(jwtString);

  if (isEesztJwt(jwtObject)) {
    return { ...jwtObject, token: data };
  }

  throw new NotRecognizedTokenError();
}

type Proof = {
  lastValid: ISODateString;
  name: string;
  vaccinationDate: ISODateString;
  isValid: boolean;
} & ({ personalId: string; passportId: string } | { ssn: string });

async function getProof(data: VedettsegiToken): Promise<Proof> {
  if ('iss' in data) {
    const siteData = await fetch(data.token)
      .then((res) => res.text())
      .then((res) =>
        res.slice(res.indexOf('<tbody class="table-data">'), res.indexOf('</tbody>') + 9),
      )
      .then((res) => matchAll(res, /<td class="table-cell">(.*?)<\/td>/gs).toArray());

    let vaccinationDate = siteData[5];
    try {
      vaccinationDate = format(parseDate(vaccinationDate, 'yyyy.MM.dd', new Date()), 'yyyy-MM-dd');
    } catch {
      // we don't care about parse error here
    }

    return {
      lastValid: new Date().toISOString(),
      name: siteData[3],
      vaccinationDate,
      personalId: siteData[9],
      passportId: siteData[11],
      isValid: siteData[13].includes('valid'),
    };
  }
  return {
    lastValid: data.ts,
    name: data.n,
    vaccinationDate: data.vd, // todo: check if this could also be just expiry for non-vac
    ssn: data.id,
    isValid: true, // todo: verify token, RS256
  };
}

export default function App(): JSX.Element {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    BarCodeScanner.requestPermissionsAsync().then(
      ({ status }) => mounted && setHasPermission(status === 'granted'),
    );
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Box flex bg='bgPrimary' justifyContent='center' alignItems='center'>
          <AnimatePresence>
            {hasPermission === true ? (
              <BarCodeScreen />
            ) : (
              <Text px='l'>
                {hasPermission === null
                  ? 'Kamera engedély kérés'
                  : 'Kamera engedély megtagadva, engedélyezze a rendszer beállítások között'}
              </Text>
            )}
          </AnimatePresence>
        </Box>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function BlurBox({ children }: { children: string | React.ReactNode }) {
  return (
    <Box
      from={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      paddingHorizontal='s'
      paddingVertical='m'
      borderRadius='m'
      overflow='hidden'
      justifyContent='center'
      alignItems='stretch'
    >
      <BlurView style={styles.hint} intensity={100} tint='dark'>
        {typeof children === 'string' ? <Text variant='hint'>{children}</Text> : children}
      </BlurView>
    </Box>
  );
}

function useScanProof() {
  const [isLoading, setLoading] = useState(false);
  const [tokenString, setTokenString] = useState<string | null>(null);
  const [proof, setProof] = useState<Proof | null | 'unknown'>();

  useEffect(() => {
    if (tokenString && !proof) setLoading(true);
    if (!tokenString || proof) setLoading(false);
    if (proof && tokenString) {
      console.log('setting timeout');
      const timeout = setTimeout(() => setTokenString(null), 5000);
      return () => clearTimeout(timeout);
    }
  }, [tokenString, proof]);

  useEffect(() => {
    if (tokenString) {
      try {
        const data = parseTokenString(tokenString);

        if (!data) throw Error();

        getProof(data).then((proofRes) => {
          setProof(proofRes);
        });
      } catch (e) {
        console.warn(e);
        setProof('unknown');
      }
    } else {
      setProof(null);
    }
  }, [setLoading, tokenString]);

  const [onBarCodeScanned, resetScanThrottle] = useThrottledCallback(
    ({ data }: BarCodeScanningResult) => {
      setTokenString(data);
    },
    1000,
    [],
  );

  const clearScan = React.useCallback(() => {
    resetScanThrottle();
    setTokenString(null);
  }, [resetScanThrottle]);

  return { proof, isLoading, onBarCodeScanned, clearScan };
}

function ProofResult({ proof }: { proof: Proof | 'unknown' }) {
  if (proof === 'unknown') return <Text variant='highlight'>ISMERETLEN</Text>;

  let { vaccinationDate } = proof;
  try {
    vaccinationDate = format(parseISO(proof.vaccinationDate), 'PPP');
  } catch (e) {
    console.error(proof, e);
  }
  return (
    <Box alignItems='stretch'>
      <Text variant='highlight' color={proof.isValid ? 'textValid' : 'textInvalid'}>
        {proof.isValid ? 'ÉRVÉNYES' : 'ÉRVÉNYTELEN'}
      </Text>
      <Space s='l' />
      <Box flexDirection='row' justifyContent='space-between'>
        <Text variant='label'>Név</Text>
        <Space s='xs' />
        <Text variant='value'>{proof.name}</Text>
      </Box>
      <Space s='xs' />
      <Box flexDirection='row' justifyContent='space-between'>
        <Text variant='label'>Oltás ideje</Text>
        <Space s='xs' />
        <Text variant='value'>{vaccinationDate}</Text>
      </Box>
      <Space s='xs' />
      {'ssn' in proof ? (
        <Box flexDirection='row' justifyContent='space-between'>
          <Text variant='label'>TAJ</Text>
          <Space s='xs' />
          <Text variant='value'>{proof.ssn}</Text>
        </Box>
      ) : (
        <>
          <Box flexDirection='row' justifyContent='space-between'>
            <Text variant='label'>Személyi</Text>
            <Space s='xs' />
            <Text variant='value'>{proof.personalId}</Text>
          </Box>
          <Space s='xs' />
          <Box flexDirection='row' justifyContent='space-between'>
            <Text variant='label'>Útlevél</Text>
            <Space s='xs' />
            <Text variant='value'>{proof.passportId}</Text>
          </Box>
        </>
      )}
    </Box>
  );
}

function BarCodeScreen() {
  const netInfo = useNetInfo();

  const [isLit, toggleLit] = useToggle(false);

  const { onBarCodeScanned, clearScan, isLoading, proof } = useScanProof();

  const { top, bottom } = useSafeAreaInsets();

  return (
    <Box flex>
      <Camera
        barCodeScannerSettings={{
          barCodeTypes: [BarCodeScanner.Constants.BarCodeType.qr],
        }}
        onBarCodeScanned={onBarCodeScanned}
        style={StyleSheet.absoluteFill}
        flashMode={isLit ? 'torch' : 'off'}
      />
      <Box flex justifyContent='space-around' alignItems='stretch'>
        <Space s={top} />
        <BlurBox>Olvassa be a védettséget igazoló QR kódot</BlurBox>
        <Box flex justifyContent='center'>
          {isLoading || proof ? (
            <BlurBox>
              {isLoading ? <ActivityIndicator size='large' /> : null}
              {proof ? <ProofResult proof={proof} /> : null}
            </BlurBox>
          ) : null}
        </Box>
        {!netInfo.isConnected ? (
          <Box mt='l'>
            <BlurBox>Internet nélkül a plasztikkártya nem ellenőrizhető</BlurBox>
          </Box>
        ) : null}
        <Box
          mx='xs'
          my='s'
          flexDirection='row'
          // alignItems="flex-end"
          justifyContent='space-between'
        >
          <QRFooterButton onPress={toggleLit} isActive={isLit} iconName='ios-flashlight' />
          <QRFooterButton onPress={clearScan} iconName='ios-close' iconSize={48} />
        </Box>
        <Space s={bottom} />
      </Box>
      <StatusBar barStyle='light-content' backgroundColor='#000' />
    </Box>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  hint: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
  },
  headerText: {
    color: '#fff',
    backgroundColor: 'transparent',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: '10%',
  },
});
