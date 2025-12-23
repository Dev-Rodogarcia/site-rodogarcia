/**
 * Dados das Filiais
 * Informações de todas as filiais da empresa
 */

export const filiais = {
    matriz: {
        nome: 'Matriz - Agudos/SP',
        endereco: 'Rua Pedro Carmine Deo, 156, Agudos, SP - 17123-210',
        telefone: '0800 591 4557',
        email: 'gerente.financeiro@rodogarcia.com.br',
        estado: 'sp'
    },
    agudos: {
        nome: 'Agudos/SP',
        endereco: 'Rua Pedro Carmine Deo, 156, Agudos, SP - 17123-210',
        telefone: '0800 591 4557',
        email: 'agudos@rodogarcia.com.br',
        estado: 'sp'
    },
    campinas: {
        nome: 'Campinas/SP',
        endereco: 'Campinas, São Paulo',
        telefone: '(19) 3XXX-XXXX',
        email: 'campinas@rodogarcia.com.br',
        estado: 'sp'
    },
    osasco: {
        nome: 'Osasco/SP',
        endereco: 'Osasco, São Paulo',
        telefone: '(11) 3XXX-XXXX',
        email: 'osasco@rodogarcia.com.br',
        estado: 'sp'
    },
    castro: {
        nome: 'Castro/PR',
        endereco: 'Castro, Paraná',
        telefone: '(42) 3XXX-XXXX',
        email: 'castro@rodogarcia.com.br',
        estado: 'pr'
    },
    curitiba: {
        nome: 'Curitiba/PR',
        endereco: 'Curitiba, Paraná',
        telefone: '(41) 3XXX-XXXX',
        email: 'curitiba@rodogarcia.com.br',
        estado: 'pr'
    },
    rio: {
        nome: 'Rio de Janeiro/RJ',
        endereco: 'Rio de Janeiro, RJ',
        telefone: '(21) 3XXX-XXXX',
        email: 'rj@rodogarcia.com.br',
        estado: 'rj'
    },
    hamburgo: {
        nome: 'Novo Hamburgo/RS',
        endereco: 'Novo Hamburgo, Rio Grande do Sul',
        telefone: '(51) 3XXX-XXXX',
        email: 'hamburgo@rodogarcia.com.br',
        estado: 'rs'
    },
    recife: {
        nome: 'Recife/PE',
        endereco: 'Recife, Pernambuco',
        telefone: '(81) 3XXX-XXXX',
        email: 'recife@rodogarcia.com.br',
        estado: 'pe'
    }
};

/**
 * Busca uma filial pelo ID
 */
export function getFilial(filialId) {
    return filiais[filialId] || null;
}

/**
 * Busca todas as filiais de um estado
 */
export function getFiliaisPorEstado(estadoId) {
    return Object.values(filiais).filter(filial => filial.estado === estadoId);
}

