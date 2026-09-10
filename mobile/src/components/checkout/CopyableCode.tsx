import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Button, HStack, Icon, Text, VStack } from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

interface CopyableCodeProps {
  label: string;
  code: string;
  helpText?: string;
}

/** Quanto tempo o botao fica em estado "copiado" antes de voltar ao normal. */
const COPIED_FEEDBACK_MS = 2000;

/**
 * Codigo longo com botao de copiar.
 *
 * Serve tanto ao copia-e-cola do Pix quanto a linha digitavel do boleto: os dois
 * sao textos que ninguem transcreve a mao.
 *
 * O codigo aparece truncado. E longo demais para caber na tela e nao ha nada que
 * o aluno precise conferir visualmente — a acao util e copiar.
 */
export function CopyableCode({ label, code, helpText }: CopyableCodeProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleCopy = useCallback(async () => {
    await Clipboard.setStringAsync(code);
    setCopied(true);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
  }, [code]);

  return (
    <VStack space={2} w="100%">
      <Text fontSize="xs" fontWeight="600" color="coolGray.500">
        {label}
      </Text>

      <Box
        bg="coolGray.100"
        _dark={{ bg: 'coolGray.700' }}
        borderRadius="lg"
        px="3"
        py="3"
      >
        <Text
          fontSize="xs"
          color="coolGray.700"
          _dark={{ color: 'coolGray.200' }}
          numberOfLines={2}
        >
          {code}
        </Text>
      </Box>

      <Button
        onPress={handleCopy}
        colorScheme={copied ? 'success' : 'primary'}
        leftIcon={
          <Icon
            as={Ionicons}
            name={copied ? 'checkmark' : 'copy-outline'}
            size="sm"
          />
        }
      >
        {copied ? 'Copiado!' : 'Copiar codigo'}
      </Button>

      {helpText ? (
        <HStack space={2} alignItems="flex-start" mt="1">
          <Icon as={Ionicons} name="information-circle-outline" size="xs" color="coolGray.400" mt="0.5" />
          <Text fontSize="2xs" color="coolGray.500" flex={1}>
            {helpText}
          </Text>
        </HStack>
      ) : null}
    </VStack>
  );
}

export default CopyableCode;
